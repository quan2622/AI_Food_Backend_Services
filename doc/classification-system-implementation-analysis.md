# HỆ THỐNG PHÂN LOẠI HÌNH ẢNH MÓN ĂN — PHÂN TÍCH THỰC THI VÀ ÁNH XẠ LÝ THUYẾT

> **Mục đích tài liệu:** Phân tích chi tiết cách hệ thống `AI_Food_Classification_Service` ứng dụng các công thức toán học, mô hình lý thuyết và sơ đồ xử lý được mô tả trong cơ sở lý thuyết, đồng thời chỉ ra vị trí code tương ứng cho từng thành phần.

---

## Mục lục

1. [Tổng quan kiến trúc hệ thống](#1-tổng-quan-kiến-trúc-hệ-thống)
2. [Bài toán phân loại ảnh — Mô hình toán học](#2-bài-toán-phân-loại-ảnh--mô-hình-toán-học)
3. [Tiền xử lý ảnh — Chuẩn hóa ImageNet](#3-tiền-xử-lý-ảnh--chuẩn-hóa-imagenet)
4. [Mạng nơ-ron tích chập (CNN)](#4-mạng-nơ-ron-tích-chập-cnn)
5. [Transfer Learning — Học chuyển giao](#5-transfer-learning--học-chuyển-giao)
6. [Kiến trúc mạng cụ thể](#6-kiến-trúc-mạng-cụ-thể)
7. [Hàm mất mát Cross-Entropy + Label Smoothing](#7-hàm-mất-mát-cross-entropy--label-smoothing)
8. [Tối ưu hóa — AdamW + Cosine Annealing](#8-tối-ưu-hóa--adamw--cosine-annealing)
9. [Tăng cường dữ liệu (Data Augmentation)](#9-tăng-cường-dữ-liệu-data-augmentation)
10. [Pipeline huấn luyện end-to-end](#10-pipeline-huấn-luyện-end-to-end)
11. [Đánh giá mô hình — Các chỉ số](#11-đánh-giá-mô-hình--các-chỉ-số)
12. [Pipeline suy luận (Inference)](#12-pipeline-suy-luận-inference)
13. [Triển khai dịch vụ — FastAPI + PostgreSQL](#13-triển-khai-dịch-vụ--fastapi--postgresql)
14. [Vòng phản hồi Human-in-the-Loop](#14-vòng-phản-hồi-human-in-the-loop)
15. [Sơ đồ tổng hợp toàn bộ hệ thống](#15-sơ-đồ-tổng-hợp-toàn-bộ-hệ-thống)

---

## 1. Tổng quan kiến trúc hệ thống

### 1.1 Cấu trúc thư mục dự án

```
AI_Food_Classification_Service/
│
├── core/
│   ├── src/                     # Mã nguồn chính
│   │   ├── config.py            # Cấu hình, đường dẫn, hyperparameters
│   │   ├── models.py            # Kiến trúc mạng, load pretrained weights
│   │   ├── dataset.py           # DataLoader, transforms, augmentation
│   │   ├── train.py             # Pipeline huấn luyện
│   │   ├── evaluate.py          # Đánh giá, confusion matrix
│   │   ├── predict.py           # Inference pipeline
│   │   ├── api.py               # FastAPI server + endpoints
│   │   ├── db.py                # SQLAlchemy ORM + PostgreSQL
│   │   ├── storage.py           # Lưu trữ file, tạo image_id
│   │   └── utils.py             # Vẽ biểu đồ, lưu lịch sử
│   │
│   ├── dataset/                 # Dữ liệu huấn luyện
│   │   ├── train/               # 70% — mỗi thư mục con = 1 lớp món ăn
│   │   ├── validate/ (val/)     # 15% — kiểm định trong quá trình train
│   │   └── test/                # 15% — đánh giá cuối cùng
│   │
│   ├── models/                  # Trọng số mô hình đã train
│   │   └── best_*.pth           # best_efficientnet_b3.pth, best_resnet50.pth...
│   │
│   ├── pretrained/              # Pretrained weights (ImageNet)
│   │   ├── efficientnet_b3_rwightman-b3899882.pth
│   │   ├── resnet50-0676ba61.pth
│   │   └── inception_v3_google-0cc3c7bd.pth
│   │
│   ├── results/                 # Kết quả huấn luyện
│   │   ├── curves_*.png         # Loss/Accuracy curves
│   │   ├── history_*.json        # Metrics theo epoch
│   │   └── cm_*.png             # Confusion matrix heatmap
│   │
│   ├── data_runtime/            # Dữ liệu runtime (upload, reviewed)
│   │   ├── uploads/             # Ảnh upload từ API
│   │   └── reviewed/            # Ảnh đã được xác nhận (feedback)
│   │
│   ├── tools/
│   │   └── filter_images.py     # Công cụ lọc ảnh
│   │
│   ├── .env                     # DATABASE_URL
│   ├── requirements.txt         # Dependencies
│   └── Makefile                 # Lệnh build/run
│
├── image-search-downloader/     # Tool hỗ trợ thu thập ảnh
└── finding-similar-images/      # Tool tìm ảnh tương tự
```

### 1.2 Các thành phần chính và luồng dữ liệu

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                           HUẤN LUYỆN (Offline)                              │
│                                                                              │
│  [dataset/train/]                                                            │
│        │                                                                     │
│        ▼                                                                     │
│  [dataset.py] ──── transforms (Resize, Crop, Augment, Normalize)               │
│        │                                                                     │
│        ▼                                                                     │
│  [models.py: EfficientNet-B3 / ResNet50 / InceptionV3]                        │
│  Pretrained weights từ [pretrained/] ─── Freezing layers                     │
│        │                                                                     │
│        ▼                                                                     │
│  [train.py] ──── CrossEntropyLoss(label_smoothing=0.1)                        │
│        ├── AdamW (weight_decay=1e-3, lr=2e-4)                                │
│        └── CosineAnnealingLR (eta_min=1e-6)                                  │
│        │                                                                     │
│        ▼                                                                     │
│  [models/best_*.pth]  +  [results/history_*.json]  +  [results/cm_*.png]    │
└──────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ (deployment)
                                      ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                           SUY LUẬN (Online / API)                            │
│                                                                              │
│  Client (Frontend)  ─── HTTP POST /predict ─── [api.py: FastAPI]              │
│        │                                        │                             │
│        │                                        ▼                             │
│        │                              [models.py: load best_*.pth]            │
│        │                                        │                             │
│        │                                        ▼                             │
│        │                              [predict.py: preprocess + inference]     │
│        │                                        │                             │
│        │                                        ▼                             │
│        │                              Top-3 predictions ──► Client            │
│        │                                        │                             │
│        │            ┌───────────────────────────┼───────────────────────────┐│
│        │            ▼                           ▼                           ││
│        │     [storage.py: lưu ảnh]      [db.py: PostgreSQL]                   ││
│        │     uploads/{id}.jpg           prediction_logs table                ││
│        │                                    │                                ││
│        │                                    ▼                                ││
│        │                           Client POST /feedback                       ││
│        │                                    │                                ││
│        │                                    ▼                                ││
│        │                    [storage.py: lưu reviewed/]                       ││
│        │                    [db.py: update feedback]                           ││
│        └────────────────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Bài toán phân loại ảnh — Mô hình toán học

### 2.1 Phát biểu bài toán

Bài toán phân loại ảnh món ăn Việt Nam được mô hình hóa dưới dạng tìm hàm giả định `f`:

$$
\hat{y} = f(X, \theta)
$$

**Ánh xạ trong code:**

```python
# core/src/models.py
# Đầu ra của mạng là vector logit z ∈ ℝ^C
logits = model(input_tensor)  # shape: (batch_size, num_classes)
# softmax chuyển thành xác suất
probs = torch.softmax(logits, dim=1)
# argmax cho dự đoán Top-1
predicted_class = torch.argmax(probs, dim=1)
```

**Giải thích các thành phần:**

| Ký hiệu | Ý nghĩa | Trong code |
|---------|---------|-----------|
| $X$ | Ma trận điểm ảnh đầu vào, kích thước $H \times W \times 3$ | `input_tensor` sau `ToTensor()`: shape $(C, H, W)$ |
| $\theta$ | Tập tham số (trọng số) của mạng CNN | `model.parameters()` — hàng triệu giá trị float |
| $f$ | Hàm giả định (kiến trúc mạng) | `EfficientNet-B3 / ResNet50 / InceptionV3` |
| $\hat{y}$ | Nhãn dự đoán (xác suất qua từng lớp) | `probs` — vector xác suất shape $(C,)$ |
| $C$ | Số lớp món ăn (tự động phát hiện từ thư mục dataset) | `NUM_CLASSES = len(CLASS_NAMES)` |

### 2.2 Tự động phát hiện số lớp từ cấu trúc thư mục

```python
# core/src/config.py
def discover_class_names():
    train_dir = DATA_DIR / 'train'
    # Mỗi thư mục con trong train/ là một lớp món ăn
    class_names = sorted([d.name for d in train_dir.iterdir() if d.is_dir()])
    return class_names

CLASS_NAMES = discover_class_names()  # Ví dụ: ['banh_cuon', 'banh_khot', 'pho', ...]
NUM_CLASSES = len(CLASS_NAMES)        # Ví dụ: 10
```

> **Điểm mạnh của thiết kế:** Hệ thống hoàn toàn tự động phát hiện số lớp và tên lớp từ cấu trúc thư mục. Khi thêm/bớt món ăn, chỉ cần thêm thư mục ảnh — không cần sửa dòng code nào.

---

## 3. Tiền xử lý ảnh — Chuẩn hóa ImageNet

### 3.1 Công thức chuẩn hóa

Trước khi đưa vào mạng, ảnh được chuẩn hóa theo thống kê phân phối chuẩn ImageNet:

$$
X' = \frac{X - \mu}{\sigma}
$$

**Ánh xạ trong code:**

```python
# core/src/dataset.py
# Validation/Test transform (cũng dùng cho inference)
val_transform = transforms.Compose([
    transforms.Resize((img_size, img_size)),
    transforms.ToTensor(),                    # (H, W, C) → (C, H, W), scale [0, 255] → [0, 1]
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],           # μ = [μ_R, μ_G, μ_B]
        std=[0.229, 0.224, 0.225]            # σ = [σ_R, σ_G, σ_B]
    ),
])
```

**Trong inference pipeline:**

```python
# core/src/predict.py
def build_transform(model_name):
    img_size = MODELS_CONFIG[model_name]['img_size']
    return transforms.Compose([
        transforms.Resize((img_size, img_size)),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
    ])
```

### 3.2 Giải thích từng bước

```
Ảnh JPEG/PNG (H×W×3, giá trị [0, 255])
        │
        ▼
┌───────────────────────────────────────┐
│ ToTensor()                             │
│  1. Chuyển (H,W,C) → (C,H,W)          │
│  2. Scale: giá trị / 255 → [0, 1]     │
│     Shape: (3, H, W), range [0, 1]   │
└───────────────────┬───────────────────┘
                    │
                    ▼
┌───────────────────────────────────────┐
│ Normalize(mean, std)                  │
│  X' = (X - mean) / std                │
│  Shape: (3, H, W), range ≈ [-2, 2]  │
└───────────────────┬───────────────────┘
                    │
                    ▼
Tensor PyTorch (C, H, W) ─── unsqueeze(0) ─── (1, C, H, W)  ← thêm batch dim
```

### 3.3 Tại sao dùng thống kê ImageNet?

Các pretrained weights được học trên ImageNet với phân phối đã chuẩn hóa này. Nếu dùng thống kê khác, đầu vào sẽ lệch phân phối, mô hình pretrained không hoạt động đúng.

> **Quy tắc quan trọng:** Cùng bộ tham số chuẩn hóa phải được dùng **nhất quán** cho train/validation/test và cho inference. Không nhất quán = phân phối đầu vào sai → mô hình hoạt động kém.

---

## 4. Mạng nơ-ron tích chập (CNN)

### 4.1 Phép toán tích chập rời rạc

Công thức tích chập trong miền rời rạc:

$$
S(i,j) = \sum_m \sum_n I(i - m, j - n) \cdot K(m, n)
$$

Trong CNN, tích chập được thực hiện qua `nn.Conv2d`:

```python
# PyTorch Conv2d (stride=1, padding=1, kernel_size=3)
# Trọng số kernel K được học tự động qua backpropagation
conv = nn.Conv2d(in_channels=3, out_channels=64, kernel_size=3, padding=1)
output = conv(input_feature_map)  # S(i,j) cho mọi vị trí
```

### 4.2 Kiến trúc phân tầng trong CNN

```
Đầu vào ảnh (300×300×3)
        │
        ▼
┌─────────────────────────────────────────────────────┐
│  Tầng tích chập (Convolutional Layers)               │
│  Trích xuất đặc trưng: biên → kết cấu → hình dạng  │
│  Trong EfficientNet-B3: 12 khối MBConv stacked       │
└──────────────────────────┬──────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────┐
│  Global Average Pooling (GAP)                       │
│  GAP(F_k) = (1/H'×W') × Σᵢⱼ F_k(i,j)              │
│  Giảm chiều: (batch, 1536, 10, 10) → (batch, 1536) │
└──────────────────────────┬──────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────┐
│  Classifier Head (Fully Connected)                  │
│  Dropout → Linear → ReLU → Dropout → Linear(C)    │
└──────────────────────────┬──────────────────────────┘
                           │
                           ▼
Vector logit z ∈ ℝ^C  ──  softmax  ──  Phân phối xác suất P(y|x)
```

### 4.3 Các loại tầng trong hệ thống

| Loại tầng | Chức năng | Trong code |
|-----------|-----------|-----------|
| **Conv2d** | Tích chập trích xuất đặc trưng | `models.py` — backbone |
| **BatchNorm2d** | Chuẩn hóa theo batch, ổn định gradient | Tích hợp sẵn trong EfficientNet/ResNet |
| **ReLU** | Hàm kích hoạt phi tuyến tính | `nn.ReLU()` trong classifier head |
| **Dropout** | Regularization, chống overfitting | `nn.Dropout(0.4)`, `nn.Dropout(0.3)` |
| **MaxPool2d / AvgPool2d** | Giảm chiều không gian, tăng invariance | Tích hợp trong backbone |
| **Linear** | Ánh xạ vector đặc trưng → không gian nhãn | Classifier head |

---

## 5. Transfer Learning — Học chuyển giao

### 5.1 Công thức transfer learning

$$
\underbrace{f_{\theta_{\text{pre}}}}_{\text{ImageNet pretrained}} \xrightarrow{\text{fine-tune}} \underbrace{f_{\theta_{\text{ft}}}}_{\text{Món ăn Việt Nam}}
$$

### 5.2 Nạp pretrained weights từ local

```python
# core/src/models.py
def load_local_pretrained_weights(model, model_name):
    pretrained_path = PRETRAINED_DIR / f'{model_name}.pth'
    if pretrained_path.exists():
        state_dict = torch.load(pretrained_path, map_location='cpu')
        model.load_state_dict(state_dict, strict=False)
        print(f'✅ Loaded pretrained weights from {pretrained_path}')
    else:
        print(f'⚠️  Pretrained file not found at {pretrained_path}, using random init')
    return model
```

### 5.3 Chiến lược đóng băng (Freezing)

**EfficientNet-B3:**

```python
# core/src/models.py — get_model('efficientnet_b3', num_classes)
# Đóng băng 6 block đặc trưng đầu tiên (features[:6])
for layer in list(m.features.children())[:6]:
    for p in layer.parameters():
        p.requires_grad = False
# Block 7–12 + classifier head → requires_grad = True
```

**ResNet50:**

```python
# core/src/models.py — get_model('resnet50', num_classes)
for name_l, param in m.named_parameters():
    # Đóng băng tất cả trừ layer3, layer4 và fc
    if not any(x in name_l for x in ['layer3', 'layer4', 'fc']):
        param.requires_grad = False
```

**InceptionV3:**

```python
# core/src/models.py — get_model('inceptionv3', num_classes)
for param in m.parameters():
    param.requires_grad = False
# Chỉ mở classifier head và auxiliary head
for param in m.fc.parameters():
    param.requires_grad = True
for param in m.AuxLogits.fc.parameters():
    param.requires_grad = True
```

### 5.4 Tại sao đóng băng các tầng đầu?

```
Tầng sớm (features[0-5]):  Biên, góc, gradient màu cơ bản
                           → Đặc trưng PHỔ QUÁT, giống ImageNet → ĐÓNG BĂNG

Tầng sâu (features[6-11]): Đặc trưng ngữ nghĩa bậc cao
                           → Cần fine-tune cho domain món ăn → TRAINABLE

Classifier Head:           → Thay hoàn toàn → TRAINABLE
```

---

## 6. Kiến trúc mạng cụ thể

### 6.1 EfficientNet-B3 — Mặc định

**Compound Scaling:**

$$
\text{depth}: d = \alpha^\phi, \quad \text{width}: w = \beta^\phi, \quad \text{resolution}: r = \gamma^\phi
$$

**Cấu hình trong hệ thống:**

```python
# core/src/config.py
MODELS_CONFIG = {
    'efficientnet_b3': {'img_size': 300, 'lr': 0.0002},
}
```

| Thông số | Giá trị |
|----------|---------|
| Input size | 300 × 300 |
| Số tham số | ~12M |
| Freezing | 6/12 block đầu |
| Classifier | `Dropout(0.4) → Linear(1536,512) → ReLU → Dropout(0.3) → Linear(512,C)` |

**MBConv Block:**

```
Input
  ↓
Pointwise Conv (1×1) — tăng chiều kênh
  ↓
Depthwise Conv (3×3 / 5×5) — trích xuất đặc trưng không gian
  ↓
SE Block — học trọng số tầm quan trọng từng kênh
  ↓
Pointwise Conv (1×1) — giảm chiều kênh
  ↓
Skip Connection (nếu input/output cùng shape)
```

### 6.2 ResNet50

**Residual Connection:**

$$
\mathbf{h}_{l+1} = \mathcal{F}(\mathbf{h}_l, \{W_l\}) + \mathbf{h}_l
$$

| Thông số | Giá trị |
|----------|---------|
| Input size | 224 × 224 |
| Số tham số | ~25M |
| Freezing | Tất cả trừ `layer3, layer4, fc` |
| Classifier | `Dropout(0.4) → Linear(2048, C)` |

### 6.3 InceptionV3

**Inception Module — Đa tỉ lệ:**

```
           Input
    ┌──────┼──────┬──────┐
 Conv   Conv  Conv  Pool
  1×1    3×3   5×5   3×3
    └──────┴──────┴──────┘
              Concat (ghép kênh)
```

| Thông số | Giá trị |
|----------|---------|
| Input size | 299 × 299 |
| Số tham số | ~23M |
| Freezing | Toàn bộ backbone |
| Classifier | `Linear(2048, C)` main + `Linear(768, C)` aux |

---

## 7. Hàm mất mát Cross-Entropy + Label Smoothing

### 7.1 Công thức Label Smoothing

Nhãn mục tiêu được làm mềm theo công thức:

$$
\tilde{y}_k = (1 - \alpha) \cdot y_k + \frac{\alpha}{C}
$$

Trong code, PyTorch tự động thực hiện khi `label_smoothing` được truyền:

```python
# core/src/train.py — train_one_model()
criterion = nn.CrossEntropyLoss(label_smoothing=0.1)  # α = 0.1
```

**Ví dụ minh họa** (C = 10 lớp, α = 0.1):

```
Nhãn gốc one-hot (y):
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 1]  ← Lớp thứ 10 (index 9)
        ↓ Label Smoothing (α=0.1)
Nhãn smoothed (ỹ):
  [0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.91]
  ← 1 lớp đúng giảm từ 1.0 → 0.91
  ← 9 lớp sai tăng từ 0.0 → 0.01
```

### 7.2 Cross-Entropy Loss với nhãn smoothed

$$
\mathcal{L}_{CE} = -\sum_{k=1}^{C} \tilde{y}_k \cdot \log P(y=k \mid x)
$$

Với nhãn one-hot sau smoothing, công thức rút gọn thành:

$$
\mathcal{L}_{CE} = -\log P(y_{\text{true}} \mid x) - \frac{\alpha}{C} \sum_{k=1}^{C} \log P(y=k \mid x)
$$

Term thứ hai chính là **entropy** của dự đoán — khi mô hình quá tự tin (P → 1 cho 1 lớp), entropy → 0 → phạt nặng.

### 7.3 Tại sao dùng Label Smoothing cho bài toán món ăn?

Nhiều cặp món ăn Việt Nam có ranh giới thị giác mờ:
- **Bánh xèo ↔ Bánh tráng nướng:** Cùng màu vàng, bề mặt giòn
- **Bánh cuốn ↔ Gỏi cuốn:** Cùng lớp bánh tráng mỏng, nhân bên trong

Label Smoothing ngăn mô hình "quá tự tin" vào nhãn cứng, buộc mô hình phải học phân phối xác suất mềm hơn → tổng quát hóa tốt hơn trên dữ liệu thực tế.

---

## 8. Tối ưu hóa — AdamW + Cosine Annealing

### 8.1 AdamW (Adam with Weight Decay)

AdamW tách biệt weight decay ra khỏi adaptive learning rate:

$$
m_t = \beta_1 \cdot m_{t-1} + (1 - \beta_1) \cdot g_t \quad \text{(moment bậc 1)}
$$

$$
v_t = \beta_2 \cdot v_{t-1} + (1 - \beta_2) \cdot g_t^2 \quad \text{(moment bậc 2)}
$$

$$
\theta_{t+1} = \theta_t - \eta \cdot \frac{\hat{m}_t}{\sqrt{\hat{v}_t} + \epsilon} - \eta \cdot \lambda \cdot \theta_t
$$

**Ánh xạ trong code:**

```python
# core/src/train.py
optimizer = torch.optim.AdamW(
    filter(lambda p: p.requires_grad, model.parameters()),
    lr=lr,
    weight_decay=1e-3  # λ = 10⁻³
)
```

### 8.2 Cosine Annealing Learning Rate Scheduler

LR thay đổi theo hàm cosine qua mỗi epoch:

$$
\eta_t = \eta_{\min} + \frac{1}{2} \bigl(\eta_{\max} - \eta_{\min}\bigr) \cdot \left(1 + \cos\frac{\pi t}{T_{\max}}\right)
$$

```python
# core/src/train.py
scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(
    optimizer,
    T_max=NUM_EPOCHS,          # 30 epochs
    eta_min=1e-6               # η_min = 10⁻⁶
)
```

**Đồ thị minh họa LR qua 30 epochs:**

```
LR
 ↑
1e-3 ┤╲
     │  ╲
     │    ╲
     │      ╲
     │        ╲
     │          ╲
     │            ╲___
     │                 ‾‾‾
5e-4 ┤                   ‾‾‾
     │                      ‾‾‾
     │                         ‾‾
1e-6 ┤──────────────────────────────────────────→ Epoch
     0    5    10    15    20    25    30
```

**Lợi ích:** LR bắt đầu cao (học nhanh) → giảm dần mượt về cuối → "hạ cánh nhẹ nhàng" vào vùng cực tiểu tốt.

### 8.3 Tối ưu hóa trong code — Huấn luyện 1 batch

```python
# core/src/train.py — trong vòng lặp train mỗi epoch
for inputs, labels in train_loader:
    inputs, labels = inputs.to(DEVICE), labels.to(DEVICE)

    optimizer.zero_grad()             # 1. Xóa gradient cũ
    outputs = model(inputs)           # 2. Forward pass
    loss = criterion(outputs, labels)  # 3. Tính CrossEntropyLoss + Label Smoothing
    loss.backward()                   # 4. Backward pass: tính gradient
    optimizer.step()                  # 5. Cập nhật trọng số (AdamW)
    scheduler.step()                  # 6. Cập nhật learning rate (Cosine Annealing)
```

### 8.4 Early Stopping

```python
# core/src/train.py — train_one_model()
EARLY_STOP_PATIENCE = 7

if val_acc > best_acc:
    best_acc = val_acc
    best_epoch = epoch
    torch.save(model.state_dict(), f'{MODEL_SAVE_DIR}/best_{model_name}.pth')
    no_improve_count = 0
else:
    no_improve_count += 1
    if no_improve_count >= EARLY_STOP_PATIENCE:
        print(f'⏹️  Early stopping at epoch {epoch}')
        break
```

---

## 9. Tăng cường dữ liệu (Data Augmentation)

### 9.1 Công thức và ánh xạ

Pipeline augmentation đầy đủ cho tập Train:

```python
# core/src/dataset.py — FoodDataset
train_tf = transforms.Compose([
    transforms.Resize((img_size + 32, img_size + 32)),   # 332×332 → resize trước crop
    transforms.RandomCrop(img_size),                      # Crop ngẫu nhiên 300×300
    transforms.RandomHorizontalFlip(p=0.5),               # Lật ngang (đối xứng bàn ăn)
    transforms.RandomVerticalFlip(p=0.1),                 # Lật dọc (hiếm gặp)
    transforms.RandomRotation(20),                         # Xoay ±20°
    transforms.ColorJitter(                                # Biến đổi màu sắc
        brightness=0.4,       # Độ sáng ±40%
        contrast=0.4,         # Tương phản ±40%
        saturation=0.4,       # Bão hòa ±40%
        hue=0.1               # Sắc độ ±10%
    ),
    transforms.GaussianBlur(                              # Làm mờ Gaussian
        kernel_size=3,
        sigma=(0.1, 2.0)
    ),
    transforms.RandomGrayscale(p=0.05),                    # 5% xác suất → thang xám
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
    transforms.RandomErasing(                             # Xóa ngẫu nhiên 1 vùng
        p=0.3,                    # 30% xác suất
        scale=(0.02, 0.2),       # Xóa 2%–20% diện tích ảnh
        ratio=(0.3, 3.3)        # Tỉ lệ khung hình vùng xóa
    ),
])
```

### 9.2 Giải thích từng phép biến đổi

| Phép biến đổi | Công thức / Tham số | Mô phỏng thực tế | Đặc trưng bất biến |
|---------------|---------------------|-------------------|-------------------|
| `Resize` (+32) → `RandomCrop` | Crop ngẫu nhiên tại $(x, y)$ | Đối tượng không luôn ở trung tâm | Vị trí trong khung hình |
| `RandomHorizontalFlip` | Lật theo trục Y, p=0.5 | Camera quay trái/phải | Chiều bàn, chiều đĩa |
| `RandomVerticalFlip` | Lật theo trục X, p=0.1 | Góc chụp trên/dưới rìa | Hướng nhìn thẳng đứng |
| `RandomRotation(20)` | Xoay ngẫu nhiên $\pm 20°$ | Camera nghiêng nhẹ | Hướng đặt đĩa |
| `ColorJitter` | brightness=0.4, contrast=0.4 | Ánh sáng nhà hàng, ngoài trời, ban đêm | Màu sắc tuyệt đối |
| `GaussianBlur` | $\sigma \in [0.1, 2.0]$ | Camera rung nhẹ, focus không hoàn hảo | Độ sắc nét |
| `RandomGrayscale` | p=0.05 | Ảnh đen trắng cũ | Kết cấu thị giác |
| `RandomErasing` | scale=(0.02, 0.2), p=0.3 | Che khuất một phần (tay, khăn, đĩa khác) | Tính đầy đủ |
| `Normalize` | $(X - 0.485) / 0.229$ | Chuẩn hóa ImageNet | — |

### 9.3 Validation/Test — Không augmentation

```python
# core/src/dataset.py
val_tf = transforms.Compose([
    transforms.Resize((img_size, img_size)),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
])
```

> **Nguyên tắc quan trọng:** Tập Validation và Test **KHÔNG** được augmentation. Nếu có, mỗi lần đánh giá cho kết quả khác nhau → so sánh giữa các lần chạy không có ý nghĩa khoa học.

---

## 10. Pipeline huấn luyện end-to-end

### 10.1 Sơ đồ luồng huấn luyện

```
┌─────────────────────────────────────────────────────────────────┐
│  1. KHỞI TẠO                                                   │
│     ├── Đọc config: model_name, img_size, lr, epochs, batch    │
│     ├── discover_class_names() → CLASS_NAMES, NUM_CLASSES      │
│     └── MODELS_CONFIG[model_name] → img_size, lr              │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  2. CHUẨN BỊ DỮ LIỆU                                           │
│     ├── ImageFolder('dataset/train/') → train_loader           │
│     ├── ImageFolder('dataset/validate/') → val_loader          │
│     ├── ImageFolder('dataset/test/') → test_loader             │
│     └── DataLoader(batch_size=32, shuffle=True, num_workers=4) │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  3. KHỞI TẠO MÔ HÌNH                                           │
│     ├── get_model(name, num_classes)                            │
│     │   ├── Load pretrained weights từ pretrained/             │
│     │   ├── Freeze theo chiến lược model                        │
│     │   └── Replace classifier head                             │
│     ├── CrossEntropyLoss(label_smoothing=0.1)                   │
│     ├── AdamW(filter(requires_grad), lr, weight_decay=1e-3)     │
│     └── CosineAnnealingLR(optimizer, T_max=30, eta_min=1e-6)   │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  4. VÒNG LẶP HUẤN LUYỆN (30 epochs hoặc Early Stopping)        │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  4a. TRAIN MODE                                          │  │
│  │      for batch in train_loader:                           │  │
│  │          optimizer.zero_grad()                            │  │
│  │          outputs = model(inputs)                          │  │
│  │          loss = criterion(outputs, labels)                │  │
│  │          loss.backward()                                  │  │
│  │          optimizer.step()                                  │  │
│  │          scheduler.step() ← mỗi batch (If_T_Step=True)    │  │
│  │                                                          │  │
│  │  4b. VALIDATION MODE                                     │  │
│  │      model.eval()                                         │  │
│  │      with torch.no_grad():                                │  │
│  │          for batch in val_loader:                         │  │
│  │              outputs = model(inputs)                       │  │
│  │              val_loss += ...                               │  │
│  │              val_acc += ...                               │  │
│  │                                                          │  │
│  │  4c. LOG & SAVE                                          │  │
│  │      - Ghi loss, acc, lr, epoch_time vào history          │  │
│  │      - Nếu val_acc > best_acc:                           │  │
│  │          best_acc = val_acc                               │  │
│  │          torch.save(model.state_dict(), 'best_*.pth')     │  │
│  │      - Early stopping: nếu 7 epoch không cải thiện → break │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  5. LƯU KẾT QUẢ                                                │
│     ├── results/history_{model_name}.json                       │
│     │     → [{epoch, train_loss, train_acc, val_loss, val_acc}  │
│     ├── results/curves_{model_name}.png (loss + accuracy)       │
│     └── results/summary_{model_name}.png (config + curves)      │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  6. ĐÁNH GIÁ TRÊN TẬP TEST                                     │
│     ├── Load best_{model_name}.pth                              │
│     ├── model.eval(), torch.no_grad()                           │
│     ├── Dự đoán toàn bộ test set                               │
│     ├── classification_report → precision, recall, F1           │
│     └── confusion_matrix → cm_{model_name}.png (heatmap)        │
└─────────────────────────────────────────────────────────────────┘
```

### 10.2 Vòng lặp huấn luyện chi tiết

```python
# core/src/train.py — train_one_model()

# Đếm số tham số trainable
trainable = sum(p.numel() for p in model.parameters() if p.requires_grad)
total = sum(p.numel() for p in model.parameters())
print(f'Total params: {total:,} | Trainable: {trainable:,}')

best_acc = 0.0
no_improve_count = 0
history = []

for epoch in range(NUM_EPOCHS):
    # ── TRAIN PHASE ──────────────────────────────────────────────
    model.train()
    running_loss, correct, total = 0.0, 0, 0

    for inputs, labels in train_loader:
        inputs, labels = inputs.to(DEVICE), labels.to(DEVICE)

        optimizer.zero_grad()
        outputs = model(inputs)                 # Forward: tensor (B, C)

        if model_name == 'inceptionv3':
            outputs, aux_outputs = outputs      # InceptionV3 trả 2 output

        loss = criterion(outputs, labels)        # CrossEntropy + Label Smoothing
        if model_name == 'inceptionv3':
            loss += 0.4 * criterion(aux_outputs, labels)  # Auxiliary loss

        loss.backward()                         # Backward: tính gradient
        optimizer.step()                        # AdamW: cập nhật tham số

        running_loss += loss.item()
        _, preds = torch.max(outputs, 1)
        correct += (preds == labels).sum().item()
        total += labels.size(0)

    # CosineAnnealing: step theo epoch (nếu không per-batch)
    scheduler.step()

    # ── VALIDATION PHASE ─────────────────────────────────────────
    model.eval()
    val_loss, val_correct, val_total = 0.0, 0, 0

    with torch.no_grad():
        for inputs, labels in val_loader:
            inputs, labels = inputs.to(DEVICE), labels.to(DEVICE)
            outputs = model(inputs)
            loss = criterion(outputs, labels)

            val_loss += loss.item()
            _, preds = torch.max(outputs, 1)
            val_correct += (preds == labels).sum().item()
            val_total += labels.size(0)

    # ── SAVE BEST + EARLY STOPPING ───────────────────────────────
    if val_acc > best_acc:
        best_acc = val_acc
        best_epoch = epoch
        torch.save(model.state_dict(), f'{MODEL_SAVE_DIR}/best_{model_name}.pth')
        no_improve_count = 0
    else:
        no_improve_count += 1
        if no_improve_count >= 7:
            print(f'⏹️  Early stopping at epoch {epoch}')
            break
```

### 10.3 Tổng hợp các công thức trong pipeline huấn luyện

| # | Công thức | Vị trí code | Tham số |
|---|-----------|------------|---------|
| 1 | $X' = (X - \mu) / \sigma$ | `dataset.py` — `Normalize()` | μ=[0.485,0.456,0.406], σ=[0.229,0.224,0.225] |
| 2 | $\tilde{y}_k = 0.9 \cdot y_k + 0.01$ | `train.py` — `CrossEntropyLoss(label_smoothing=0.1)` | α=0.1, C=10 |
| 3 | $\mathcal{L}_{CE} = -\sum \tilde{y}_k \log P_k$ | `train.py` — `criterion(outputs, labels)` | |
| 4 | $m_t = \beta_1 m_{t-1} + (1-\beta_1) g_t$ | PyTorch AdamW | β₁=0.9 (mặc định) |
| 5 | $v_t = \beta_2 v_{t-1} + (1-\beta_2) g_t^2$ | PyTorch AdamW | β₂=0.999 (mặc định) |
| 6 | $\theta_{t+1} = \theta_t - \eta \cdot \hat{m}_t/(\sqrt{\hat{v}_t}+\epsilon) - \eta \cdot \lambda \cdot \theta_t$ | PyTorch AdamW | λ=1e-3 |
| 7 | $\eta_t = \eta_{\min} + \frac{1}{2}(\eta_{\max}-\eta_{\min})(1+\cos\frac{\pi t}{T_{\max}})$ | `scheduler.step()` | η_max=2e-4, η_min=1e-6, T_max=30 |

---

## 11. Đánh giá mô hình — Các chỉ số

### 11.1 Accuracy

$$
\text{Accuracy} = \frac{TP + TN}{TP + TN + FP + FN}
$$

### 11.2 Precision, Recall, F1-Score

$$
\text{Precision}_k = \frac{TP_k}{TP_k + FP_k} \qquad
\text{Recall}_k = \frac{TP_k}{TP_k + FN_k} \qquad
F1_k = 2 \cdot \frac{\text{Precision}_k \cdot \text{Recall}_k}{\text{Precision}_k + \text{Recall}_k}
$$

### 11.3 Confusion Matrix

$$
CM[i][j] = \#\{x : y_{\text{true}} = i,\ \hat{y} = j\}
$$

**Ánh xạ trong code:**

```python
# core/src/evaluate.py
from sklearn.metrics import classification_report, confusion_matrix
import seaborn as sns
import matplotlib.pyplot as plt

# Chạy inference trên toàn bộ test set
all_preds, all_labels = [], []
model.eval()
with torch.no_grad():
    for inputs, labels in test_loader:
        outputs = model(inputs.to(DEVICE))
        _, preds = torch.max(outputs, 1)
        all_preds.extend(preds.cpu().numpy())
        all_labels.extend(labels.numpy())

# Classification report
print(classification_report(all_labels, all_preds, target_names=CLASS_NAMES))

# Confusion matrix heatmap
cm = confusion_matrix(all_labels, all_preds)
fig, ax = plt.subplots(figsize=(12, 10))
sns.heatmap(cm, annot=True, fmt='d', cmap='Blues',
            xticklabels=CLASS_NAMES, yticklabels=CLASS_NAMES, ax=ax)
plt.xlabel('Predicted')
plt.ylabel('True')
plt.savefig(f'{RESULTS_DIR}/cm_{model_name}.png', dpi=150)
```

### 11.4 Các chỉ số mà hệ thống đánh giá

| Chỉ số | Công thức | Ý nghĩa | Trong code |
|--------|-----------|---------|-----------|
| **Accuracy** | $(TP+TN)/(TP+TN+FP+FN)$ | Tỉ lệ dự đoán đúng toàn phần | `classification_report` |
| **Macro Precision** | $\frac{1}{C}\sum Precision_k$ | TB không trọng số qua các lớp | `classification_report` |
| **Macro Recall** | $\frac{1}{C}\sum Recall_k$ | TB không trọng số qua các lớp | `classification_report` |
| **Macro F1** | $\frac{1}{C}\sum F1_k$ | TB F1 không trọng số | `classification_report` |
| **Weighted F1** | $\sum w_k \cdot F1_k$ | TB có trọng số theo số mẫu mỗi lớp | `classification_report` |
| **Confusion Matrix** | $CM[i][j]$ | Số mẫu lớp $i$ bị nhầm thành $j$ | `evaluate.py` |

---

## 12. Pipeline suy luận (Inference)

### 12.1 Sơ đồ luồng inference

```
Client gửi ảnh (HTTP POST /predict, multipart/form-data)
        │
        ▼
┌────────────────────────────────────────────────────────────────┐
│  1. TIẾP NHẬN VÀ XÁ THỰC                                       │
│     ├── Kiểm tra file có tồn tại                               │
│     ├── Kiểm tra model_name hợp lệ (mặc định: efficientnet_b3) │
│     └── Kiểm tra file trọng số tồn tại                        │
│        → Lỗi HTTP 400 / 404 nếu sai                            │
└────────────────────────────┬───────────────────────────────────┘
                             │
                             ▼
┌────────────────────────────────────────────────────────────────┐
│  2. LƯU TRỮ ẢNH ĐẦU VÀO                                        │
│     image_id = YYYYMMDD_HHMMSS_{uuid8}                         │
│     stored_path = data_runtime/uploads/{image_id}.{ext}         │
│     → Lưu file vào disk để hỗ trợ truy vết sau này            │
└────────────────────────────┬───────────────────────────────────┘
                             │
                             ▼
┌────────────────────────────────────────────────────────────────┐
│  3. NẠP MÔ HÌNH TỪ CACHE (Lazy Loading)                        │
│     ├── Kiểm tra app.state.model_cache[model_name]            │
│     ├── Nếu chưa có: load best_{model_name}.pth               │
│     │     → freeze toàn bộ, set eval()                        │
│     │     → warmup với dummy tensor                           │
│     └── Lưu vào cache để reuse                                 │
└────────────────────────────┬───────────────────────────────────┘
                             │
                             ▼
┌────────────────────────────────────────────────────────────────┐
│  4. TIỀN XỬ LÝ HÌNH ẢNH                                        │
│     Ảnh PIL đầu vào                                            │
│        │                                                        │
│        ▼                                                        │
│     Resize(img_size) → ToTensor() → Normalize(ImageNet)         │
│        │                                                        │
│        ▼                                                        │
│     Tensor (C, H, W) → unsqueeze(0) → (1, C, H, W)            │
│     → Di chuyển sang DEVICE (GPU/CPU)                          │
└────────────────────────────┬───────────────────────────────────┘
                             │
                             ▼
┌────────────────────────────────────────────────────────────────┐
│  5. SUY LUẬN MÔ HÌNH                                           │
│     model.eval()                                                │
│     with torch.no_grad():  ← Tiết kiệm bộ nhớ GPU ~50%         │
│         logits = model(input_tensor)                           │
│     probs = softmax(logits, dim=1)                              │
│     → Vector xác suất (C,) ∈ [0, 1], tổng = 1                 │
└────────────────────────────┬───────────────────────────────────┘
                             │
                             ▼
┌────────────────────────────────────────────────────────────────┐
│  6. HẬU XỬ LÝ — TOP-3                                         │
│     top3_prob, top3_idx = torch.topk(probs, 3)                 │
│     → Top-1: dự đoán chính                                     │
│     → Top-2, Top-3: ứng viên thay thế                          │
│     → Confidence = xác suất softmax                             │
└────────────────────────────┬───────────────────────────────────┘
                             │
                             ▼
┌────────────────────────────────────────────────────────────────┐
│  7. LƯU DATABASE + TRẢ KẾT QUẢ                               │
│     ├── db.py: Tạo prediction_log record                      │
│     │     → image_id, filename, stored_path, model_name,       │
│     │       top1_class_name, top1_confidence, predictions[]   │
│     └── HTTP Response JSON:                                    │
│          {image_id, model_name, top1: {class, confidence},    │
│           top2: {...}, top3: {...}}                            │
└────────────────────────────────────────────────────────────────┘
```

### 12.2 Code chi tiết pipeline inference

```python
# core/src/predict.py
def predict_with_model(image_path, model, model_name, model_lock):
    # 1. Build transform tương thích với mô hình
    transform = build_transform(model_name)

    # 2. Load + preprocess ảnh
    img = Image.open(image_path).convert('RGB')
    inp = transform(img).unsqueeze(0).to(DEVICE)
    # inp shape: (1, C=3, H=img_size, W=img_size)

    # 3. Inference với lock (thread-safe) + no_grad (tiết kiệm bộ nhớ)
    with model_lock:
        with torch.no_grad():
            logits = model(inp)
            probs = torch.softmax(logits, dim=1)[0]  # shape: (C,)

    # 4. Lấy Top-3
    top3_prob, top3_idx = torch.topk(probs, 3)

    # 5. Build response
    predictions = [
        {
            'rank': rank,
            'class_name': CLASS_NAMES[idx.item()],
            'class_id': idx.item(),
            'confidence': round(prob.item(), 6)
        }
        for rank, (prob, idx) in enumerate(zip(top3_prob, top3_idx), start=1)
    ]

    return {
        'image_path': str(image_path),
        'model_name': model_name,
        'predictions': predictions,
    }
```

### 12.3 Warmup — Khởi động GPU

```python
# core/src/predict.py
def warmup_model(model, model_name):
    img_size = MODELS_CONFIG[model_name]['img_size']
    dummy_input = torch.zeros((1, 3, img_size, img_size), device=DEVICE)
    with torch.no_grad():
        _ = model(dummy_input)
    print(f'🔥 Model {model_name} warmup complete')
```

Warmup thực thi:
1. **JIT compile** các kernel CUDA (GPU)
2. Khởi tạo buffer nội bộ của BatchNorm layers
3. Giảm độ trễ cho request đầu tiên thực sự từ ~500ms → ~50ms

---

## 13. Triển khai dịch vụ — FastAPI + PostgreSQL

### 13.1 Kiến trúc startup (Lifespan)

```python
# core/src/api.py — FastAPI app
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # ── STARTUP ──────────────────────────────────────────────────
    ensure_runtime_dirs()           # Tạo uploads/, reviewed/
    init_db()                        # SQLAlchemy: tạo engine + schema + tables
    check_db_connection()            # Kiểm tra kết nối PostgreSQL

    # Load tất cả trained models vào cache
    available_models = load_available_models()  # dict: model_name → (model, lock)
    for name, (model, lock) in available_models.items():
        app.state.model_cache[name] = model
        app.state.model_locks[name] = lock
        warmup_model(model, name)

    print(f'✅ {len(available_models)} models ready')
    yield  # ← App đang chạy tại đây

    # ── SHUTDOWN ────────────────────────────────────────────────
    print('👋 Shutting down models...')
```

### 13.2 Các endpoints

```
GET  /                             → Trả thông tin hệ thống (models, classes, paths)
GET  /health                       → Health check: model ready, DB connected, loaded models
GET  /classes                       → Danh sách tên các lớp món ăn
POST /predict                       → Upload ảnh → Top-3 predictions
GET  /feedback/stats                 → Thống kê feedback theo lớp
POST /feedback                       → Xác nhận/chỉnh nhãn dự đoán
```

### 13.3 Database Schema

```python
# core/src/db.py
from sqlalchemy import Column, String, Boolean, Float, DateTime, Boolean
from sqlalchemy.orm import DeclarativeBase

class Base(DeclarativeBase):
    pass

class PredictionLog(Base):
    __tablename__ = 'prediction_logs'

    image_id: Mapped[str]           # PK: YYYYMMDD_HHMMSS_uuid
    original_filename: Mapped[str]
    stored_path: Mapped[str]        # data_runtime/uploads/{image_id}.jpg
    model_name: Mapped[str]         # efficientnet_b3 / resnet50 / inceptionv3
    top1_class_name: Mapped[str]    # Tên lớp dự đoán chính
    top1_confidence: Mapped[float]  # Xác suất softmax của Top-1

    # JSON column — toàn bộ Top-3
    predictions: Mapped[list]       # [{rank, class_name, confidence}, ...]

    uploaded_at: Mapped[datetime]   # Thời điểm upload

    # Feedback fields
    is_feedback_received: Mapped[bool]      # User có gửi phản hồi không
    confirmed_label: Mapped[str]             # Nhãn user xác nhận/chỉnh
    is_correct: Mapped[bool]                 # Dự đoán có đúng không
    notes: Mapped[str]                      # Ghi chú tùy ý
    reviewed_path: Mapped[str]               # data_runtime/reviewed/{label}/{id}.jpg
    reviewed_at: Mapped[datetime]           # Thời điểm feedback
```

### 13.4 Thread Safety

```python
# core/src/api.py
# Mỗi model có một Lock riêng → ngăn xung đột khi nhiều request đồng thời
app.state.model_locks = {}
app.state.model_cache = {}

for name, (model, lock) in available_models.items():
    app.state.model_cache[name] = model
    app.state.model_locks[name] = lock

# Trong predict endpoint:
@router.post('/predict')
async def predict(file: UploadFile, model_name: str = 'efficientnet_b3'):
    model = app.state.model_cache[model_name]
    lock = app.state.model_locks[model_name]

    # Lock được acquire khi inference, release khi xong
    result = await asyncio.to_thread(
        predict_with_model, saved_path, model, model_name, lock
    )
```

---

## 14. Vòng phản hồi Human-in-the-Loop

### 14.1 Mục đích

```
User upload ảnh → Model dự đoán → User xác nhận/chỉnh nhãn
                                              │
                                              ▼
                            Ảnh được lưu vào data_runtime/reviewed/{label}/
                            Metadata được cập nhật trong PostgreSQL
                                              │
                                              ▼
                        Nguồn "hard examples" cho retraining tiếp theo
                        Giúp model cải thiện đúng chỗ yếu
```

### 14.2 Feedback flow

```python
# core/src/api.py — POST /feedback
@router.post('/feedback')
async def submit_feedback(
    image_id: str,
    confirmed_label: str,    # Phải nằm trong CLASS_NAMES
    is_correct: bool = None,
    notes: str = None
):
    # 1. Xác thực nhãn
    if confirmed_label not in CLASS_NAMES:
        raise HTTPException(400, f'Invalid label: {confirmed_label}')

    # 2. Copy ảnh vào reviewed/{confirmed_label}/
    upload_path = app.state.uploads_dir / f'{image_id}.jpg'
    reviewed_path = save_reviewed_copy(confirmed_label, upload_path)

    # 3. Cập nhật PostgreSQL
    update_prediction_feedback(
        image_id=image_id,
        confirmed_label=confirmed_label,
        is_correct=(confirmed_label == predicted_label) if is_correct is None else is_correct,
        notes=notes,
        reviewed_path=str(reviewed_path),
        reviewed_at=datetime.now()
    )

    return {'status': 'ok', 'reviewed_path': str(reviewed_path)}
```

### 14.3 Cấu trúc thư mục reviewed

```
data_runtime/reviewed/
├── banh_cuon/
│   ├── 20260422_143022_a1b2c3d4.jpg    ← Ảnh user xác nhận là bánh cuốn
│   └── 20260422_153511_e5f6g7h8.jpg
├── banh_khot/
│   └── ...
├── pho/
│   └── ...
└── ...
```

---

## 15. Sơ đồ tổng hợp toàn bộ hệ thống

### 15.1 Kiến trúc tổng thể

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENTS                                         │
│   Frontend App (Web/Mobile) ─── HTTP POST /predict ─── Upload ảnh món ăn    │
│         │                                                          │         │
│         │◄─── JSON: Top-3 predictions ────────────────────────────┤         │
│         │                                                          │         │
│         └─── HTTP POST /feedback ─── Xác nhận/chỉnh nhãn ───────────┘         │
└──────────────────────────────────────┬────────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    AI_FOOD_CLASSIFICATION_SERVICE                           │
│                         (FastAPI + Uvicorn)                                  │
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │  Lifespan Startup:                                                  │   │
│   │  1. ensure_runtime_dirs() → Tạo uploads/, reviewed/                 │   │
│   │  2. init_db() → PostgreSQL: tạo schema, tables                      │   │
│   │  3. load_available_models() → Nạp best_*.pth vào RAM/VRAM           │   │
│   │  4. warmup_model() → Dummy inference để khởi tạo GPU kernels       │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │  POST /predict (upload ảnh → suy luận → Top-3)                      │   │
│   │                                                                     │   │
│   │  [1] Tiếp nhận multipart/form-data                                   │   │
│   │  [2] create_image_id() = YYYYMMDD_HHMMSS_uuid                       │   │
│   │  [3] save_uploaded_file() → uploads/{id}.ext                        │   │
│   │  [4] model = app.state.model_cache[model_name]                      │   │
│   │  [5] lock = app.state.model_locks[model_name]                      │   │
│   │  [6] predict_with_model() — thread-safe với lock + no_grad         │   │
│   │      ├── build_transform(model_name)                                │   │
│   │      ├── Image.open().convert('RGB')                                 │   │
│   │      ├── Resize → ToTensor → Normalize(ImageNet)                    │   │
│   │      ├── model(input) → softmax → topk(3)                           │   │
│   │      └── return [{rank, class_name, confidence}]                   │   │
│   │  [7] create_prediction_log() → PostgreSQL                           │   │
│   │  [8] return JSON response                                            │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │  POST /feedback                                                     │   │
│   │  [1] Xác thực confirmed_label ∈ CLASS_NAMES                         │   │
│   │  [2] save_reviewed_copy(label, upload_path) → reviewed/{label}/     │   │
│   │  [3] update_prediction_feedback() → PostgreSQL                       │   │
│   │  [4] return {status: ok}                                             │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │  GET /health → {status, db_connected, models_loaded}              │   │
│   │  GET /classes → CLASS_NAMES (auto-discovered)                       │   │
│   │  GET /feedback/stats → {class_name: {total, correct, incorrect}}   │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │  STORAGE LAYER                                                      │   │
│   │  uploads/{YYYYMMDD_HHMMSS_uuid}.{ext}  ← Ảnh chờ xử lý            │   │
│   │  reviewed/{class_name}/{id}.{ext}      ← Ảnh đã xác nhận           │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │  DATABASE: PostgreSQL (192.168.30.128:5432/ai_food_db)               │   │
│   │  Table: prediction_logs                                             │   │
│   │  ├── image_id (PK)    → YYYYMMDD_HHMMSS_uuid                        │   │
│   │  ├── predictions[]    → Top-3 với confidence                        │   │
│   │  ├── is_feedback_received → bool                                    │   │
│   │  ├── confirmed_label  → Nhãn user xác nhận                         │   │
│   │  ├── is_correct       → Dự đoán đúng/sai                           │   │
│   │  └── reviewed_path    → Đường dẫn ảnh đã review                    │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 15.2 Luồng dữ liệu end-to-end

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         HUẤN LUYỆN (Offline)                                │
│                                                                             │
│  dataset/train/banh_cuon/   dataset/train/pho/   dataset/train/com_tam/    │
│       │                            │                        │             │
│       ▼                            ▼                        ▼             │
│  [ImageFolder]              [ImageFolder]            [ImageFolder]           │
│       │                            │                        │             │
│       └────────────────────────────┼────────────────────────┘             │
│                                    ▼                                        │
│                           train_loader (B=32)                               │
│                                    │                                        │
│                                    ▼                                        │
│  pretrained/efficientnet_b3.pth  │  [models.py]                          │
│              │                    │  ├── Load pretrained                   │
│              │                    │  ├── Freeze 6 blocks                   │
│              │                    │  └── Replace classifier(C=10)          │
│              │                    ▼                                        │
│              │              [EfficientNet-B3]                              │
│              │                    │                                        │
│              │                    ▼                                        │
│              │         CrossEntropyLoss(label_smoothing=0.1)                │
│              │                    │                                        │
│              │         AdamW(lr=2e-4, weight_decay=1e-3)                    │
│              │                    │                                        │
│              │         CosineAnnealingLR(T_max=30, eta_min=1e-6)           │
│              │                    │                                        │
│              │            ┌───────┴───────┐                                │
│              │            ▼               ▼                                │
│              │     Train Epoch      Validation Epoch                         │
│              │     (backward)        (no_grad)                               │
│              │            │               │                                │
│              │            ▼               ▼                                │
│              │     [Early Stopping: patience=7]                             │
│              │            │               │                                │
│              │            ▼               ▼                                │
│              │     best_efficientnet_b3.pth  +  history.json  +  curves.png │
│              │                                    │                          │
│              │                                    ▼                          │
│              │                           results/curves.png               │
│              │                           results/cm.png (heatmap)           │
│              │                                                                 │
└─────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       │ (deploy)
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        SUY LUẬN (Online)                                     │
│                                                                             │
│  Client ─── POST /predict ─── uploads/{id}.jpg                              │
│                    │                                                        │
│                    ▼                                                        │
│  build_transform(img_size=300)                                              │
│  Image.open().convert('RGB') → Resize → ToTensor → Normalize(ImageNet)      │
│  inp: (1, 3, 300, 300) ─── to(DEVICE)                                       │
│                    │                                                        │
│                    ▼                                                        │
│  model.eval()                                                                │
│  with torch.no_grad():                                                       │
│      probs = softmax(model(inp), dim=1)[0]                                  │
│  topk(probs, 3) → [Top-1, Top-2, Top-3]                                     │
│                    │                                                        │
│                    ▼                                                        │
│  create_prediction_log() ─── PostgreSQL                                     │
│                    │                                                        │
│                    ▼                                                        │
│  JSON Response ─── Client                                                   │
│  {image_id, model_name,                                                      │
│   predictions: [{rank, class_name, confidence}, ...]}                       │
│                                                                             │
│  Client ─── POST /feedback ─── {image_id, confirmed_label, is_correct}     │
│                    │                                                        │
│                    ▼                                                        │
│  save_reviewed_copy() ─── data_runtime/reviewed/{label}/{id}.jpg           │
│  update_prediction_feedback() ─── PostgreSQL                                │
│                    │                                                        │
│                    ▼                                                        │
│  {status: ok} ─── Client                                                    │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 15.3 Bảng tổng hợp: Lý thuyết ↔ Code

| # | Công thức / Khái niệm lý thuyết | Vị trí code | Mô tả ngắn |
|---|--------------------------------|-------------|------------|
| 1 | $\hat{y} = f(X, \theta)$ | `models.py` — `model(input)` | Mô hình học sâu nhận đầu vào, trả logit |
| 2 | $X' = (X - \mu) / \sigma$ | `dataset.py` — `Normalize()` | Chuẩn hóa theo ImageNet |
| 3 | $S(i,j) = \sum I \cdot K$ | PyTorch `nn.Conv2d` | Tích chập trích xuất đặc trưng |
| 4 | $\tilde{y}_k = (1-\alpha)y_k + \alpha/C$ | `train.py` — `label_smoothing=0.1` | Label Smoothing ngăn overconfidence |
| 5 | $\mathcal{L}_{CE} = -\sum \tilde{y}_k \log P_k$ | `train.py` — `CrossEntropyLoss()` | Hàm mất mát Cross-Entropy |
| 6 | $m_t = \beta_1 m_{t-1} + (1-\beta_1)g_t$ | PyTorch AdamW (β₁=0.9) | Moment bậc 1 |
| 7 | $v_t = \beta_2 v_{t-1} + (1-\beta_2)g_t^2$ | PyTorch AdamW (β₂=0.999) | Moment bậc 2 |
| 8 | $\theta_{t+1} = \theta_t - \eta \hat{m}/(\sqrt{\hat{v}}+\epsilon) - \eta\lambda\theta$ | `train.py` — AdamW(weight_decay=1e-3) | Cập nhật tham số AdamW |
| 9 | $\eta_t = \eta_{\min} + \frac{1}{2}(\eta_{\max}-\eta_{\min})(1+\cos\frac{\pi t}{T_{\max}})$ | `train.py` — `CosineAnnealingLR` | LR scheduler cosine |
| 10 | $\text{depth}= \alpha^\phi,\ \text{width}=\beta^\phi,\ \text{res}= \gamma^\phi$ | `models.py` — EfficientNet-B3 | Compound Scaling |
| 11 | $\mathbf{h}_{l+1} = \mathcal{F}(\mathbf{h}_l) + \mathbf{h}_l$ | PyTorch ResNet — skip connection | Residual connection |
| 12 | $P(y=k \mid x) = e^{z_k} / \sum e^{z_c}$ | `predict.py` — `torch.softmax(logits, dim=1)` | Softmax chuyển logit → xác suất |
| 13 | $\text{GAP}(F_k) = \frac{1}{H'W'}\sum F_k(i,j)$ | Tích hợp trong backbone | Global Average Pooling |
| 14 | $\hat{x} = (x - \mu_{\mathcal{B}})/\sqrt{\sigma^2_{\mathcal{B}}+\epsilon}$ | PyTorch `BatchNorm2d` | Batch Normalization |
| 15 | $CM[i][j] = \#\{x: y_{\text{true}}=i, \hat{y}=j\}$ | `evaluate.py` — `confusion_matrix()` | Ma trận nhầm lẫn |
| 16 | $P_{repeat} = 1 - 0.85^{count}$ | `predict.py` (trong recommend system) | Exponential decay penalty |
| 17 | $\vec{R} = \vec{T}_{\text{target}} - \vec{C}_{\text{consumed}}$ | `predict.py` (inference metadata) | Remaining nutrition vector |
| 18 | $S_{\text{cosine}}(\vec{R}, \vec{F}) = \frac{\vec{R} \cdot \vec{F}}{||\vec{R}|| \times ||\vec{F}||}$ | (Tính năng sẵn sàng cho content-based) | Cosine similarity dinh dưỡng |

---

## Tài liệu tham khảo

1. **EfficientNet** — Tan, M., & Le, Q. (2019). *EfficientNet: Rethinking model scaling for convolutional neural networks.* ICML 2019.
2. **ResNet** — He, K., et al. (2016). *Deep residual learning for image recognition.* CVPR 2016.
3. **InceptionV3** — Szegedy, C., et al. (2016). *Rethinking the inception architecture for computer vision.* CVPR 2016.
4. **AdamW** — Loshchilov, I., & Hutter, F. (2019). *Decoupled weight decay regularization.* ICLR 2019.
5. **Label Smoothing** — Müller, R., et al. (2019). *When does label smoothing help?* NeurIPS 2019.
6. **Transfer Learning Survey** — Zhuang, F., et al. (2020). *A comprehensive study of transfer learning.* IEEE.
7. **Data Augmentation** — Shorten, C., & Khoshgoftaar, T. (2019). *A survey on image data augmentation for deep learning.* Journal of Big Data.
8. **Cosine Similarity** — Salton, G. (1989). *Automatic Text Processing.*
9. **MMR** — Carbonell, J., & Goldstein, J. (1998). *The Use of MMR, Diversity-Based Reranking.* SIGIR 1998.
