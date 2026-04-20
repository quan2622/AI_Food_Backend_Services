# HỆ THỐNG NHẬN DIỆN HÌNH ẢNH MÓN ĂN — CƠ SỞ LÝ THUYẾT VÀ THỰC NGHIỆM

> **Mục đích tài liệu:** Tổng hợp đầy đủ cơ sở lý thuyết phục vụ thuyết trình báo cáo luận văn tốt nghiệp về hệ thống nhận diện ảnh món ăn Việt Nam bằng học sâu (Deep Learning).

---

## Mục lục

1. [Tổng quan bài toán](#1-tổng-quan-bài-toán)
2. [Cơ sở xử lý ảnh số (Digital Image Processing)](#2-cơ-sở-xử-lý-ảnh-số)
3. [Thị giác máy tính và phân loại ảnh](#3-thị-giác-máy-tính-và-phân-loại-ảnh)
4. [Học máy và học sâu — Nguyên lý tối ưu hóa](#4-học-máy-và-học-sâu)
5. [Mạng nơ-ron tích chập (CNN)](#5-mạng-nơ-ron-tích-chập)
6. [Transfer Learning — Học chuyển giao](#6-transfer-learning)
7. [Các kiến trúc mạng được sử dụng](#7-các-kiến-trúc-mạng-được-sử-dụng)
8. [Tăng cường dữ liệu (Data Augmentation)](#8-tăng-cường-dữ-liệu)
9. [Quy trình huấn luyện end-to-end](#9-quy-trình-huấn-luyện-end-to-end)
10. [Đánh giá mô hình — Các chỉ số và phân tích lỗi](#10-đánh-giá-mô-hình)
11. [Kết quả thực nghiệm — EfficientNet-B3](#11-kết-quả-thực-nghiệm)
12. [Triển khai dịch vụ (FastAPI)](#12-triển-khai-dịch-vụ)
13. [Tổng kết và hướng phát triển](#13-tổng-kết-và-hướng-phát-triển)

---

## 1. Tổng quan bài toán

### 1.1 Đặt vấn đề

Nhận diện hình ảnh món ăn (Food Image Recognition) là một bài toán phân loại ảnh (image classification) đặc thù trong lĩnh vực thị giác máy tính. Bài toán đặt ra yêu cầu: **cho một bức ảnh chụp một món ăn, hệ thống phải tự động xác định đó là món gì** trong tập các nhãn đã được định nghĩa trước.

Về mặt toán học, bài toán được mô hình hóa như sau:

$$
f_\theta : \mathbb{R}^{H \times W \times 3} \to \{1, 2, \dots, C\}
$$

Trong đó:

- $x \in \mathbb{R}^{H \times W \times 3}$ — ảnh đầu vào với chiều cao $H$, chiều rộng $W$ và 3 kênh màu RGB
- $f_\theta$ — mô hình học sâu với tham số $\theta$
- $C$ — số lượng lớp món ăn (được suy ra tự động từ cấu trúc thư mục dữ liệu)
- $y \in \{1, 2, \dots, C\}$ — nhãn dự đoán

> **Chú thích cho thuyết trình:** Cách thiết kế `num_classes` tự động từ thư mục có ưu điểm quan trọng là hệ thống không cần sửa code khi thêm/bớt lớp món ăn — chỉ cần thêm thư mục chứa ảnh vào dữ liệu huấn luyện. Đây là thiết kế thực tế và linh hoạt cho ứng dụng triển khai thực.

### 1.2 Thách thức đặc thù của ảnh món ăn Việt Nam

Ảnh món ăn khác biệt so với ảnh vật thể thông thường ở những điểm sau:

| Thách thức                       | Mô tả                                                | Ví dụ                                                     |
| -------------------------------- | ---------------------------------------------------- | --------------------------------------------------------- |
| **Biến thiên ngoại cảnh**        | Ánh sáng, góc chụp, nền bàn thay đổi rất lớn         | Cùng một đĩa phở nhưng chụp trong nhà hàng vs. lề đường   |
| **Ranh giới lớp mờ**             | Nhiều món có đặc trưng thị giác rất gần nhau         | Bánh xèo vs. bánh tráng nướng: cùng màu vàng, bề mặt giòn |
| **Phong cách trình bày đa dạng** | Cùng một món nhưng bày biện khác nhau theo vùng miền | Bánh mì Sài Gòn vs. Hà Nội                                |
| **Chồng lấp thành phần**         | Món ăn thường có nhiều nguyên liệu che khuất nhau    | Gỏi cuốn, cơm tấm với nhiều topping                       |

### 1.3 Hướng tiếp cận được chọn

Dự án sử dụng **học sâu với transfer learning** — tận dụng kiến trúc CNN được tiền huấn luyện trên ImageNet (hàng triệu ảnh), sau đó fine-tune trên tập dữ liệu món ăn Việt Nam. Ba kiến trúc được thử nghiệm: **EfficientNet-B3**, **ResNet50** và **InceptionV3**.

---

## 2. Cơ sở xử lý ảnh số

### 2.1 Biểu diễn ảnh màu RGB

Một ảnh màu được biểu diễn dưới dạng tensor 3 chiều:

$$
I \in \mathbb{R}^{H \times W \times 3}
$$

Mỗi điểm ảnh $(i, j)$ chứa 3 giá trị cường độ màu: Red, Green, Blue, mỗi kênh nằm trong đoạn $[0, 255]$. Khi đưa vào mạng nơ-ron, tensor này được chuẩn hóa về $[0, 1]$ trước.

> **Chú thích:** PyTorch dùng định dạng $(C, H, W)$ thay vì $(H, W, C)$ — tức là kênh màu đứng đầu. Hàm `transforms.ToTensor()` tự động chuyển đổi và scale về $[0, 1]$.

### 2.2 Chuẩn hóa theo thống kê ImageNet

Pipeline tiền xử lý chuẩn hóa ảnh theo **trung bình và độ lệch chuẩn của tập ImageNet**:

$$
\hat{x}_c = \frac{x_c - \mu_c}{\sigma_c}
$$

Với các giá trị:

- $\boldsymbol{\mu} = [0.485,\ 0.456,\ 0.406]$ — trung bình theo 3 kênh RGB
- $\boldsymbol{\sigma} = [0.229,\ 0.224,\ 0.225]$ — độ lệch chuẩn theo 3 kênh RGB

> **Tại sao dùng thống kê ImageNet?** Vì các pretrained weights được học trên phân phối ảnh ImageNet đã chuẩn hóa theo giá trị này. Nếu dùng thống kê khác, đầu vào sẽ lệch khỏi phân phối mà mô hình đã "kỳ vọng", dẫn đến hiệu năng suy giảm ngay từ vòng đầu tiên của fine-tuning.

> **Quan trọng:** Cùng một bộ tham số chuẩn hóa phải được dùng **nhất quán** cho cả 3 tập Train/Validation/Test và cho cả giai đoạn suy luận (inference) trong API — đây là yêu cầu kỹ thuật quan trọng trong triển khai thực tế.

### 2.3 Tích chập rời rạc — Phép toán nền tảng

Phép tích chập rời rạc (discrete convolution) là nền tảng từ xử lý ảnh cổ điển đến mạng CNN:

$$
S(i,j) = \sum_m \sum_n I(i-m,\, j-n)\, K(m,n)
$$

Trong đó:

- $I$ — ảnh đầu vào (input feature map)
- $K$ — kernel (bộ lọc), kích thước $k \times k$
- $S$ — feature map đầu ra

**Sự khác biệt giữa xử lý ảnh cổ điển và học sâu:**

| Xử lý ảnh truyền thống                                          | Học sâu (CNN)                                    |
| --------------------------------------------------------------- | ------------------------------------------------ |
| Kernel được **thiết kế thủ công** (Sobel, Gaussian, Laplacian…) | Kernel được **học tự động** qua gradient descent |
| Mục đích: làm trơn, phát hiện biên, lọc nhiễu                   | Mục đích: tối ưu cho bài toán phân loại cụ thể   |
| Không phụ thuộc dữ liệu                                         | Phụ thuộc hoàn toàn vào dữ liệu huấn luyện       |

---

## 3. Thị giác máy tính và phân loại ảnh

### 3.1 Định nghĩa bài toán phân loại ảnh đơn nhãn

Dự án sử dụng bài toán **phân loại ảnh một nhãn (single-label image classification)**: mỗi ảnh đầu vào được gán **duy nhất một nhãn** là tên món ăn. Đây là lựa chọn phù hợp với:

- Dữ liệu tổ chức theo cấu trúc thư mục: mỗi thư mục là một lớp, chứa ảnh thuộc lớp đó
- Kịch bản API thực tế: người dùng chụp một món ăn để nhận diện

> **Phân biệt với multi-label classification:** Nếu một ảnh có thể chứa nhiều món ăn cùng lúc (ví dụ: mâm cơm), thì cần multi-label. Trong phạm vi luận văn này, mỗi ảnh chứa một món ăn chính, nên single-label là đủ và tối ưu hơn về độ phức tạp triển khai.

### 3.2 Pipeline xử lý end-to-end

```
[Ảnh đầu vào (JPEG/PNG)]
        ↓
[Tiền xử lý: Resize → ToTensor → Normalize]
        ↓
[Backbone CNN: trích xuất đặc trưng]
        ↓
[Global Average Pooling]
        ↓
[Classifier Head: Dropout → Linear → ReLU → Dropout → Linear]
        ↓
[Logit vector z ∈ ℝᶜ]
        ↓
[Softmax → Phân phối xác suất]
        ↓
[Top-3 dự đoán có xác suất cao nhất]
```

> **Lý do trả về Top-3 thay vì Top-1:** Trong thực tế, một số lớp món ăn rất gần nhau về thị giác (ví dụ: Bánh xèo vs. Bánh khọt). Trả về Top-3 giúp người dùng xác nhận kết quả và hệ thống backend có thêm thông tin để ra quyết định chính xác hơn. Đây cũng là cơ chế hỗ trợ vòng phản hồi dữ liệu (human-in-the-loop).

---

## 4. Học máy và học sâu

### 4.1 Học có giám sát (Supervised Learning)

Mô hình học từ tập dữ liệu có nhãn $\mathcal{D} = \{(x_i, y_i)\}_{i=1}^{N}$. Mục tiêu là tìm tham số $\theta^*$ sao cho:

$$
\theta^* = \arg\min_\theta \frac{1}{N} \sum_{i=1}^{N} \mathcal{L}\bigl(f_\theta(x_i),\, y_i\bigr)
$$

Với $\mathcal{L}$ là hàm mất mát (loss function) đo khoảng cách giữa dự đoán và nhãn thực.

### 4.2 Hàm kích hoạt Softmax và Cross-Entropy Loss

Đầu ra của mạng là vector logit $\mathbf{z} = [z_1, z_2, \dots, z_C]$. Softmax chuyển đổi sang phân phối xác suất:

$$
P(y = k \mid x) = \frac{e^{z_k}}{\sum_{c=1}^{C} e^{z_c}}, \quad \sum_{k=1}^{C} P(y=k|x) = 1
$$

Hàm mất mát Cross-Entropy cho một mẫu $(x, y)$:

$$
\mathcal{L}_{CE} = -\sum_{k=1}^{C} \mathbf{1}[y=k] \cdot \log P(y=k|x) = -\log P(y_{\text{true}} \mid x)
$$

> **Trực quan:** Cross-entropy phạt nặng khi mô hình gán xác suất thấp cho nhãn đúng. Log làm cho phạt tăng nhanh theo cấp số nhân khi xác suất gần 0 — điều này thúc đẩy mô hình phải "tự tin đúng".

### 4.3 Label Smoothing — Kỹ thuật giảm over-confidence

Thay vì dùng nhãn cứng one-hot $\mathbf{y} = [0, \dots, 1, \dots, 0]$, Label Smoothing "làm mềm" nhãn:

$$
\tilde{y}_k = \begin{cases} 1 - \varepsilon + \dfrac{\varepsilon}{C} & \text{nếu } k = y_{\text{true}} \\[6pt] \dfrac{\varepsilon}{C} & \text{nếu } k \neq y_{\text{true}} \end{cases}
$$

Trong dự án, $\varepsilon = 0.1$ được sử dụng (tức `CrossEntropyLoss(label_smoothing=0.1)`).

> **Tại sao cần Label Smoothing trong bài toán món ăn?** Nhiều lớp món ăn có ranh giới thị giác mờ (Bánh xèo vs. Bánh khọt đều có màu vàng, giòn). Label Smoothing ngăn mô hình "quá tự tin" vào nhãn cứng, khiến mô hình học phân phối đặc trưng mềm hơn và tổng quát hóa tốt hơn trên dữ liệu mới.

### 4.4 Thuật toán tối ưu AdamW

AdamW (Adam with decoupled Weight Decay) kết hợp:

- **Adaptive learning rate:** mỗi tham số có learning rate riêng dựa trên moment bậc 1 và bậc 2
- **Weight decay tách biệt:** thêm trực tiếp vào cập nhật trọng số, không thông qua gradient

$$
m_t = \beta_1 m_{t-1} + (1-\beta_1) g_t \quad \text{(moment bậc 1)}
$$

$$
v_t = \beta_2 v_{t-1} + (1-\beta_2) g_t^2 \quad \text{(moment bậc 2)}
$$

$$
\theta_{t+1} = \theta_t - \eta \cdot \frac{\hat{m}_t}{\sqrt{\hat{v}_t} + \epsilon} - \eta \cdot \lambda \cdot \theta_t
$$

Trong đó $\lambda$ là hệ số weight decay. Dự án dùng `weight_decay=1e-3`.

> **Lý do chọn AdamW thay vì Adam thông thường?** Trong Adam, weight decay bị "trộn lẫn" vào gradient nên hiệu ứng regularization không thuần khiết. AdamW tách riêng, cho kết quả ổn định hơn trong fine-tuning pretrained models — điều này đã được chứng minh qua nhiều công trình (Loshchilov & Hutter, 2019).

### 4.5 Cosine Annealing Learning Rate Scheduler

Learning rate thay đổi theo hàm cosine trong suốt $T_{\max}$ epoch:

$$
\eta_t = \eta_{\min} + \frac{1}{2}(\eta_{\max} - \eta_{\min}) \left(1 + \cos\frac{\pi t}{T_{\max}}\right)
$$

Với $\eta_{\min} = 10^{-6}$ (eta*min), $T*{\max} = 30$ (số epoch).

> **Lợi ích:** Learning rate bắt đầu cao để học nhanh ở giai đoạn đầu, rồi giảm dần và mượt mà về cuối. Điều này giúp mô hình "hạ cánh nhẹ nhàng" vào vùng cực tiểu tốt, tránh dao động mạnh ở cuối huấn luyện — vấn đề hay gặp với fixed learning rate.

### 4.6 Early Stopping

Nếu validation accuracy không cải thiện sau `EARLY_STOP_PATIENCE = 7` epoch liên tiếp, quá trình huấn luyện dừng sớm để:

- Tiết kiệm tài nguyên tính toán
- Tránh overfitting (mô hình ghi nhớ dữ liệu train thay vì học đặc trưng tổng quát)

---

## 5. Mạng nơ-ron tích chập

### 5.1 Kiến trúc tổng quát của CNN

CNN khai thác 3 đặc tính quan trọng của dữ liệu ảnh:

| Đặc tính             | Cơ chế trong CNN                       | Ý nghĩa                                |
| -------------------- | -------------------------------------- | -------------------------------------- |
| **Locality**         | Kết nối cục bộ (local receptive field) | Pixel gần nhau tương quan hơn pixel xa |
| **Chia sẻ trọng số** | Cùng kernel áp dụng cho toàn ảnh       | Đặc trưng cạnh/góc ở bất kỳ vị trí nào |
| **Phân cấp**         | Stack nhiều tầng tích chập             | Học đặc trưng từ đơn giản đến phức tạp |

### 5.2 Học đặc trưng phân cấp

Trong một CNN sâu, mỗi nhóm tầng học một mức biểu diễn khác nhau:

```
Tầng sớm  (Early layers):   Biên, góc, đường thẳng, gradient màu
     ↓
Tầng giữa (Mid layers):     Kết cấu (texture), hình dạng cơ bản, motif thị giác
     ↓
Tầng sâu  (Deep layers):    Đặc trưng ngữ nghĩa: "miếng thịt nướng", "nước dùng", "bánh tráng"
     ↓
Classifier head:             Kết hợp → phân loại "Phở", "Bún bò", "Bánh mì"...
```

> **Đây là lý do Transfer Learning hoạt động:** Các đặc trưng ở tầng sớm và giữa (biên, kết cấu, hình dạng) là **phổ quát** — chúng hữu ích cho bất kỳ bài toán nhận diện ảnh nào, không chỉ ImageNet. Chỉ các tầng sâu nhất và classifier head mới cần học lại cho món ăn Việt Nam.

### 5.3 Pooling và Batch Normalization

**Global Average Pooling (GAP):** Thay vì flatten toàn bộ feature map thành vector lớn, GAP lấy trung bình không gian:

$$
\text{GAP}(F_k) = \frac{1}{H' \times W'} \sum_{i,j} F_k(i, j)
$$

Giảm mạnh số tham số, giảm overfitting, và tạo ra biểu diễn bất biến với vị trí (translation invariant).

**Batch Normalization (BN):** Chuẩn hóa đầu ra của mỗi tầng trong mini-batch:

$$
\hat{x} = \frac{x - \mu_{\mathcal{B}}}{\sqrt{\sigma^2_{\mathcal{B}} + \epsilon}}, \quad y = \gamma \hat{x} + \beta
$$

Giúp gradient lan truyền ổn định, cho phép learning rate cao hơn, và có tác dụng regularization nhẹ.

**Dropout:** Trong quá trình huấn luyện, mỗi neuron bị tắt ngẫu nhiên với xác suất $p$:

- EfficientNet-B3 head: `Dropout(0.4)` → `Linear(512)` → `ReLU` → `Dropout(0.3)` → `Linear(num_classes)`
- ResNet50 head: `Dropout(0.4)` → `Linear(num_classes)`

> **Lý do đặt hai lớp Dropout ở EfficientNet-B3:** Đây là "deep classifier head" với thêm một tầng ẩn 512 units. Dropout đầu (0.4) regularize đầu vào, Dropout giữa (0.3) regularize tầng ẩn — tránh overfitting trên tập dữ liệu món ăn nhỏ hơn ImageNet.

---

## 6. Transfer Learning

### 6.1 Nguyên lý và lý do sử dụng

**Transfer Learning** là kỹ thuật tận dụng kiến thức đã học từ bài toán nguồn (ImageNet — 1.2 triệu ảnh, 1000 lớp) để giải quyết bài toán đích (nhận diện món ăn Việt Nam).

$$
\underbrace{f_{\theta_{\text{pre}}}}_{\text{ImageNet pretrained}} \xrightarrow{\text{fine-tune}} \underbrace{f_{\theta_{\text{fine}}}}_{\text{Món ăn Việt Nam}}
$$

**Lý do thực tiễn trong luận văn:**

- Dữ liệu món ăn có hạn → không đủ để train from scratch hiệu quả
- Giảm chi phí tính toán (không cần GPU mạnh, train nhanh hơn nhiều)
- Kết quả tốt hơn đáng kể so với random initialization

### 6.2 Chiến lược đóng băng (Freezing Strategy)

Trong dự án, chiến lược đóng băng khác nhau cho từng kiến trúc:

**EfficientNet-B3:**

```python
# Đóng băng 6 block đặc trưng đầu tiên
for layer in list(m.features.children())[:6]:
    for p in layer.parameters():
        p.requires_grad = False
# Mở (trainable): các block sâu + classifier head mới
```

**ResNet50:**

```python
# Đóng băng tất cả trừ layer3, layer4 và fc
for name_l, param in m.named_parameters():
    if not any(x in name_l for x in ['layer3','layer4','fc']):
        param.requires_grad = False
```

**InceptionV3:**

```python
# Đóng băng toàn bộ backbone
for param in m.parameters():
    param.requires_grad = False
# Chỉ mở classifier head và auxiliary head
for param in m.fc.parameters():        param.requires_grad = True
for param in m.AuxLogits.fc.parameters(): param.requires_grad = True
```

> **Triết lý đằng sau chiến lược đóng băng:** Các block đầu học đặc trưng phổ quát (biên, màu sắc, kết cấu cơ bản) → **giữ nguyên**. Các block sâu học đặc trưng ngữ nghĩa cao → **fine-tune** để thích nghi với món ăn. Chiến lược này cân bằng giữa tái sử dụng tri thức và thích nghi với domain mới.

---

## 7. Các kiến trúc mạng được sử dụng

### 7.1 EfficientNet-B3 — Kiến trúc mặc định

#### Ý tưởng Compound Scaling

EfficientNet (Tan & Le, 2019) đề xuất mở rộng mạng **đồng thời theo 3 chiều** thay vì chỉ tăng độ sâu:

$$
\text{depth: } d = \alpha^\phi, \quad \text{width: } w = \beta^\phi, \quad \text{resolution: } r = \gamma^\phi
$$

Ràng buộc: $\alpha \cdot \beta^2 \cdot \gamma^2 \approx 2$ (FLOPS tăng gấp đôi khi $\phi$ tăng 1 đơn vị).

> **Trực quan:** Tăng chỉ độ sâu → gradient vanishing. Tăng chỉ chiều rộng → mất thông tin cấu trúc sâu. EfficientNet cân bằng cả ba, cho độ chính xác cao với số tham số ít hơn các mô hình cùng level.

#### Khối MBConv (Mobile Inverted Bottleneck Convolution)

Khối cơ bản của EfficientNet:

```
Input
  ↓
Pointwise Conv (expand channels, 1×1)   ← Tăng chiều kênh để học đặc trưng phong phú
  ↓
Depthwise Conv (3×3 hoặc 5×5)           ← Học đặc trưng không gian
  ↓
SE Block (Squeeze-and-Excitation)        ← Học trọng số tầm quan trọng của từng kênh
  ↓
Pointwise Conv (project, 1×1)            ← Giảm chiều kênh
  ↓
Skip Connection (residual)               ← Nếu input/output cùng shape
```

**SE Block (Squeeze-and-Excitation):** Học "kênh nào quan trọng hơn" cho từng ảnh cụ thể:

$$
\tilde{\mathbf{u}}_c = \text{sigmoid}(W_2 \cdot \text{ReLU}(W_1 \cdot \text{GAP}(\mathbf{U}))) \cdot \mathbf{u}_c
$$

> **Tại sao EfficientNet-B3 là lựa chọn mặc định?** Trong thực nghiệm trên các bài toán nhận diện thực phẩm (Food-101, UEC-Food256), EfficientNet-B3 đạt top accuracy với ~12M tham số — ít hơn ResNet50 (~25M) nhưng hiệu quả hơn. Đây là sự cân bằng tốt giữa hiệu năng và tài nguyên cho môi trường triển khai thực tế.

#### Cấu hình trong dự án

| Thông số        | Giá trị                                                |
| --------------- | ------------------------------------------------------ |
| Input size      | 300×300                                                |
| Số tham số tổng | ~12M                                                   |
| Classifier head | `Dropout(0.4)→Linear(512)→ReLU→Dropout(0.3)→Linear(C)` |
| Đóng băng       | 6 block đầu (`features[:6]`)                           |
| Learning rate   | 1e-4                                                   |

### 7.2 ResNet50 — Kiến trúc với Residual Connection

#### Vấn đề Vanishing Gradient trong mạng sâu

Khi stack nhiều tầng, gradient từ tầng cuối lan ngược về đầu bị nhân liên tiếp với các Jacobian nhỏ:

$$
\frac{\partial \mathcal{L}}{\partial \theta_1} = \frac{\partial \mathcal{L}}{\partial h_L} \cdot \prod_{l=1}^{L} \frac{\partial h_l}{\partial h_{l-1}}
$$

Nếu các Jacobian $< 1$, tích này → 0 khi $L$ lớn (vanishing gradient). Nếu $> 1$ → exploding gradient.

#### Giải pháp: Residual (Skip) Connection

$$
\mathbf{h}_{l+1} = \mathcal{F}(\mathbf{h}_l, \{W_l\}) + \mathbf{h}_l
$$

```
Input h_l ─────────────────────────────────────┐ (skip)
    ↓                                           │
Conv → BN → ReLU → Conv → BN → ReLU → Conv → BN│
    ↓                                           ↓
  F(h_l)                                 h_l + F(h_l)
                                               ↓
                                              ReLU
```

> **Tại sao Residual Connection giải quyết được vấn đề?** Gradient có thể đi thẳng qua skip connection mà không cần qua các tầng Conv — đảm bảo gradient không bị vanish ngay cả ở mạng 50+ tầng. Thực ra, ResNet học **phần dư** (residual) thay vì học trực tiếp mapping — điều này dễ tối ưu hơn về mặt lý thuyết.

#### Kiến trúc Bottleneck Block của ResNet50

```
Conv 1×1 (giảm channels: 256→64)   ← Bottleneck để giảm tính toán
Conv 3×3 (học đặc trưng không gian)
Conv 1×1 (tăng channels: 64→256)   ← Khôi phục chiều
+ Skip Connection
```

#### Cấu hình trong dự án

| Thông số        | Giá trị                         |
| --------------- | ------------------------------- |
| Input size      | 224×224                         |
| Số tham số tổng | ~25M                            |
| Classifier head | `Dropout(0.4)→Linear(C)`        |
| Đóng băng       | Tất cả trừ `layer3, layer4, fc` |
| Learning rate   | 5e-5                            |

### 7.3 InceptionV3 — Kiến trúc Đa Tỉ Lệ

#### Ý tưởng Inception Module

Thay vì chọn một kích thước kernel, **Inception Module** thực hiện đồng thời nhiều tích chập với kích thước khác nhau rồi ghép kết quả:

```
        Input
   ┌────┼────┬──────┐
 Conv  Conv Conv  MaxPool
 1×1   3×3  5×5    3×3
   └────┴────┴──────┘
          Concat
```

Điều này cho phép mạng **học đặc trưng ở nhiều tỉ lệ đồng thời** — rất phù hợp cho ảnh món ăn nơi chi tiết quan trọng có thể ở nhiều kích thước (toàn bộ đĩa vs. chi tiết nhân bánh).

#### Auxiliary Classifier (Bộ phân loại phụ)

InceptionV3 có một nhánh phụ (auxiliary branch) tại tầng giữa mạng. Trong huấn luyện:

$$
\mathcal{L}_{\text{total}} = \mathcal{L}_{\text{main}} + 0.4 \cdot \mathcal{L}_{\text{aux}}
$$

```python
# Trong train.py
if model_name == 'inceptionv3':
    out, aux = model(inputs)
    loss = criterion(out, labels) + 0.4 * criterion(aux, labels)
```

> **Mục đích auxiliary classifier:** Giải quyết vanishing gradient theo cách khác — cung cấp gradient trực tiếp vào tầng giữa mạng, không cần đi qua toàn bộ các tầng sâu. Hệ số 0.4 (nhỏ hơn 1) đảm bảo nhánh chính vẫn chiếm ưu thế trong optimization. **Lưu ý:** Khi inference, auxiliary branch bị bỏ qua, chỉ dùng đầu ra chính.

#### Cấu hình trong dự án

| Thông số        | Giá trị                                            |
| --------------- | -------------------------------------------------- |
| Input size      | 299×299                                            |
| Số tham số tổng | ~23M                                               |
| Classifier head | `Linear(2048→C)` cho main, `Linear(768→C)` cho aux |
| Đóng băng       | Toàn bộ backbone, chỉ mở 2 head                    |
| Learning rate   | 5e-5                                               |

---

## 8. Tăng cường dữ liệu

### 8.1 Nguyên lý

**Data Augmentation** tạo ra các biến thể nhân tạo từ ảnh gốc để tăng tính đa dạng tập huấn luyện, giúp mô hình học đặc trưng **bất biến với các biến đổi không thay đổi ngữ nghĩa**.

### 8.2 Pipeline augmentation trong dự án

```python
# Tập TRAIN — augmentation đầy đủ
transforms.Resize(img_size + 32)           # Resize lớn hơn để crop ngẫu nhiên
transforms.RandomCrop(img_size)            # Cắt ngẫu nhiên — học bất biến vị trí
transforms.RandomHorizontalFlip()          # Lật ngang — món ăn đối xứng
transforms.RandomRotation(15)             # Xoay ±15° — góc chụp tự nhiên
transforms.ColorJitter(                   # Thay đổi màu — ánh sáng, white balance
    brightness=0.3, contrast=0.3, saturation=0.2
)
transforms.ToTensor()
transforms.Normalize(mean, std)
```

```python
# Tập VALIDATION / TEST — KHÔNG augmentation
transforms.Resize(img_size)
transforms.CenterCrop(img_size)           # Chỉ crop trung tâm, xác định
transforms.ToTensor()
transforms.Normalize(mean, std)
```

### 8.3 Giải thích từng phép biến đổi

| Phép biến đổi          | Mô phỏng biến động thực tế                   | Đặc trưng bất biến được học    |
| ---------------------- | -------------------------------------------- | ------------------------------ |
| `RandomCrop`           | Đối tượng không luôn ở trung tâm ảnh         | Vị trí món ăn trong khung hình |
| `RandomHorizontalFlip` | Góc chụp trái/phải                           | Chiều của đĩa, bát             |
| `RandomRotation(15)`   | Camera nghiêng nhẹ                           | Hướng nhìn                     |
| `ColorJitter`          | Ánh sáng trong nhà hàng, ngoài trời, ban đêm | Màu sắc tuyệt đối              |

> **Quy tắc quan trọng cho đánh giá học thuật:** Tập Validation và Test **không được augmentation ngẫu nhiên**. Nếu không, mỗi lần đánh giá sẽ cho kết quả khác nhau do randomness, khiến việc so sánh giữa các lần chạy/các mô hình không còn ý nghĩa khoa học. Đây là nguyên tắc cơ bản của thiết kế thực nghiệm.

---

## 9. Quy trình huấn luyện end-to-end

### 9.1 Sơ đồ tổng quát

```
[Cấu hình: model_name, img_size, lr, num_epochs]
                ↓
[Load dữ liệu Train/Val/Test với DataLoader]
                ↓
[Khởi tạo model với pretrained weights → đóng băng tầng]
                ↓
[Thiết lập: CrossEntropyLoss(label_smoothing=0.1)]
[Thiết lập: AdamW optimizer (chỉ trainable params)]
[Thiết lập: CosineAnnealingLR scheduler]
                ↓
┌──────────────────────────────────────────┐
│           Vòng lặp epoch (30 epochs)     │
│                                          │
│  [Train mode: forward + backward + step] │
│  [Eval mode: forward only, no_grad]      │
│  [Log: loss, acc, lr, epoch_time]        │
│  [Save checkpoint nếu val_acc tốt hơn]  │
│  [Early stopping nếu không cải thiện    │
│   sau 7 epoch liên tiếp]                │
└──────────────────────────────────────────┘
                ↓
[Lưu best model: best_{model_name}.pth]
[Vẽ biểu đồ: loss curve, accuracy curve]
                ↓
[Đánh giá trên tập Test → Report + Confusion Matrix]
```

### 9.2 Vòng lặp huấn luyện một epoch

**Giai đoạn Train:**

```
For each batch (inputs, labels) in train_loader:
    1. inputs, labels → GPU (DEVICE)
    2. optimizer.zero_grad()             ← Xóa gradient cũ
    3. outputs = model(inputs)           ← Forward pass
    4. loss = criterion(outputs, labels) ← Tính loss
    5. loss.backward()                   ← Backward: tính gradient
    6. optimizer.step()                  ← Cập nhật tham số
    7. scheduler.step()                  ← Điều chỉnh learning rate
```

**Giai đoạn Validation:**

```
model.eval()
with torch.no_grad():                    ← Tắt autograd, tiết kiệm bộ nhớ
    For each batch (inputs, labels) in val_loader:
        outputs = model(inputs)
        val_loss, val_acc += ...
```

> **`torch.no_grad()`:** Rất quan trọng trong validation và inference. Tắt việc xây dựng computation graph → giảm ~50% bộ nhớ GPU và tăng tốc đáng kể. Trong inference production (FastAPI), luôn dùng `torch.no_grad()`.

### 9.3 Chiến lược lưu checkpoint

```python
if val_acc > best_acc:
    best_acc = val_acc
    best_epoch = epoch
    torch.save(model.state_dict(), f'best_{model_name}.pth')
```

Chỉ lưu **state dict** (từ điển tham số), không lưu toàn bộ object model. Điều này đảm bảo tương thích khi load lại với code khác nhau, và tệp checkpoint nhỏ hơn.

---

## 10. Đánh giá mô hình

### 10.1 Accuracy

$$
\text{Accuracy} = \frac{\text{Số dự đoán đúng}}{\text{Tổng số mẫu}} = \frac{TP + TN}{TP + TN + FP + FN}
$$

> **Hạn chế của Accuracy:** Nếu một lớp chiếm 90% dữ liệu, mô hình chỉ cần đoán luôn lớp đó để đạt 90% accuracy dù không học được gì. Do đó, cần các chỉ số bổ sung.

### 10.2 Precision, Recall, F1-Score (cho từng lớp)

$$
\text{Precision}_k = \frac{TP_k}{TP_k + FP_k}
$$

> Trong số những ảnh mà mô hình dự đoán là "Bánh mì", bao nhiêu % thực sự là Bánh mì?

$$
\text{Recall}_k = \frac{TP_k}{TP_k + FN_k}
$$

> Trong số tất cả ảnh Bánh mì thực sự, bao nhiêu % mô hình tìm ra được?

$$
F1_k = 2 \cdot \frac{\text{Precision}_k \cdot \text{Recall}_k}{\text{Precision}_k + \text{Recall}_k}
$$

> F1 là trung bình điều hòa — cân bằng giữa Precision và Recall. Thấp khi một trong hai thấp.

**Trong classification report của dự án:**

- `macro avg` — trung bình không trọng số qua các lớp (mỗi lớp đóng góp như nhau)
- `weighted avg` — trung bình có trọng số theo số mẫu (phản ánh hiệu năng tổng thể)

### 10.3 Confusion Matrix — Ma trận nhầm lẫn

Confusion matrix là bảng $C \times C$ trong đó phần tử $(i, j)$ = số mẫu thực sự là lớp $i$ được dự đoán là lớp $j$.

$$
CM[i][j] = \#\{x : y_{\text{true}} = i,\ f(x) = j\}
$$

**Đường chéo chính** = dự đoán đúng. **Ngoài đường chéo** = nhầm lẫn.

> **Cách đọc confusion matrix cho thuyết trình:** Hàng = nhãn thực tế, Cột = nhãn dự đoán. Ô $(i, j)$ sáng/đậm ngoài đường chéo → mô hình hay nhầm lớp $i$ với lớp $j$ → cần điều tra nguyên nhân thị giác hoặc bổ sung dữ liệu.

---

## 11. Kết quả thực nghiệm — EfficientNet-B3

### 11.1 Confusion Matrix chi tiết

Kết quả trên tập Test với **EfficientNet-B3** (kiến trúc mặc định):

| Lớp              | Tổng mẫu | Dự đoán đúng | Tỷ lệ đúng |
| ---------------- | -------- | ------------ | ---------- |
| Banh cuon        | 228      | 212          | 93.0%      |
| Banh khot        | 167      | 160          | 95.8%      |
| Banh mi          | 268      | 258          | 96.3%      |
| Banh trang nuong | 159      | 152          | 95.6%      |
| Banh xeo         | 235      | 207          | 88.1%      |
| Ca kho to        | 136      | 122          | 89.7%      |
| Com tam          | 189      | 187          | 98.9%      |
| Goi cuon         | 172      | 165          | 95.9%      |
| Pho              | 162      | 158          | 97.5%      |
| Xoi xeo          | 105      | 103          | 98.1%      |

**Tổng số mẫu test: ~1,821 ảnh, 10 lớp**

### 11.2 Phân tích lỗi từ Confusion Matrix

**Cặp lớp dễ nhầm nhất:**

```
Banh xeo (207/235 đúng):
  → Nhầm sang Banh trang nuong: 13 ảnh  (5.5%)
  → Nhầm sang Banh khot:        7 ảnh   (3.0%)

Ca kho to (122/136 đúng):
  → Nhầm sang Banh trang nuong: 6 ảnh   (4.4%)
  → Nhầm sang Pho:              3 ảnh   (2.2%)

Banh cuon (212/228 đúng):
  → Nhầm sang Goi cuon:         5 ảnh   (2.2%)
  → Nhầm sang Banh trang nuong: 5 ảnh   (2.2%)
```

**Giải thích nguyên nhân thị giác:**

- **Bánh xèo ↔ Bánh tráng nướng:** Cả hai đều có màu vàng nâu, bề mặt giòn, hình tròn → đặc trưng màu sắc và kết cấu rất gần nhau
- **Bánh cuốn ↔ Gỏi cuốn:** Đều có lớp bánh tráng mỏng trong suốt, nhân bên trong → hình dạng tổng thể tương tự

### 11.3 Nhận xét tổng thể

- **Cơm tấm** đạt 98.9% — đặc trưng thị giác độc đáo (cơm hạt tấm + sườn nướng + các topping màu sắc đặc trưng)
- **Xôi xèo** đạt 98.1% — màu vàng nghệ đặc trưng, khó nhầm với món khác
- **Bánh xèo** thấp nhất 88.1% — thách thức thị giác lớn nhất, cần bổ sung dữ liệu đa dạng hơn
- Accuracy tổng thể ước tính: **~95%** trên tập test

---

## 12. Triển khai dịch vụ

### 12.1 Kiến trúc API (FastAPI)

```
POST /predict                       ← Upload ảnh → trả top-3 dự đoán
GET  /classes                       ← Danh sách các lớp món ăn
GET  /health                        ← Kiểm tra trạng thái dịch vụ
POST /feedback                      ← Người dùng xác nhận/chỉnh nhãn
GET  /models                        ← Danh sách model đã load
```

### 12.2 Quy trình inference an toàn

```python
# Pipeline inference trong production
def predict_with_model(image_path, model, model_name, model_lock):
    # 1. Build transform (consistent với training)
    transform = build_transform(model_name)

    # 2. Load và preprocess ảnh
    img = Image.open(image_path).convert('RGB')
    inp = transform(img).unsqueeze(0).to(DEVICE)  # thêm batch dim

    # 3. Inference với lock (thread-safe) + no_grad
    with model_lock:
        with torch.no_grad():
            probs = torch.softmax(model(inp), dim=1)[0]

    # 4. Lấy Top-3
    top3_prob, top3_idx = torch.topk(probs, 3)
    return [{'rank': i+1, 'class_name': CLASS_NAMES[idx],
             'confidence': round(p, 6)} for i,(p,idx) in enumerate(zip(top3_prob, top3_idx))]
```

### 12.3 Model Caching và Warm-up

**Model Caching:** Tất cả model được load vào RAM/VRAM khi khởi động dịch vụ — không load lại cho mỗi request.

**Warm-up:** Sau khi load model, chạy inference với tensor giả (dummy) để:

1. JIT compile các kernel CUDA (nếu dùng GPU)
2. Khởi tạo các buffer nội bộ của BN layers
3. Giảm latency cho request đầu tiên thực sự

```python
def warmup_model(model, model_name):
    img_size = MODELS_CONFIG[model_name]['img_size']
    dummy_input = torch.zeros((1, 3, img_size, img_size), device=DEVICE)
    with torch.no_grad():
        _ = model(dummy_input)   # "làm nóng" model
```

### 12.4 Thread Safety với Model Lock

Trong môi trường web server nhiều concurrent request, nhiều thread cùng gọi inference trên một model object có thể gây race condition. Dự án dùng `threading.Lock()` per-model:

```python
model_locks = {name: Lock() for name in loaded_models}
# Mỗi request acquire lock trước khi inference, release sau khi xong
```

### 12.5 Vòng phản hồi Human-in-the-Loop

Sau khi hệ thống dự đoán, người dùng có thể:

- **Xác nhận:** nhãn dự đoán đúng → ảnh được lưu vào thư mục `reviewed/{class_name}/`
- **Chỉnh sửa:** chọn nhãn đúng → ảnh được lưu với nhãn mới

Metadata (ảnh gốc, nhãn dự đoán, nhãn xác nhận, confidence, timestamp) được lưu vào PostgreSQL.

> **Giá trị của cơ chế này:** Tạo ra nguồn dữ liệu "hard examples" — những ảnh mà model đã từng nhầm. Retraining với bộ dữ liệu này sẽ giúp model cải thiện đúng chỗ yếu, thay vì chỉ thêm dữ liệu random.

---

## 13. Tổng kết và hướng phát triển

### 13.1 Tổng kết đóng góp

| Hạng mục              | Nội dung                                                                          |
| --------------------- | --------------------------------------------------------------------------------- |
| **Bài toán**          | Phân loại đơn nhãn 10 lớp món ăn Việt Nam từ ảnh đơn                              |
| **Mô hình tốt nhất**  | EfficientNet-B3 (fine-tuned, transfer learning)                                   |
| **Kỹ thuật chính**    | Transfer learning, Label smoothing, AdamW + Cosine LR, Dropout, Data augmentation |
| **Độ chính xác**      | ~95% overall trên tập test                                                        |
| **Điểm mạnh**         | Pipeline end-to-end, API production-ready, human-in-the-loop feedback             |
| **Điểm yếu quan sát** | Bánh xèo/Bánh tráng nướng vẫn còn nhầm lẫn (~12% của Bánh xèo)                    |

### 13.2 Hướng cải tiến tiếp theo

1. **Mở rộng tập lớp:** Thêm các món ăn Việt Nam phổ biến khác (bún bò, hủ tiếu, gỏi bắp chuối...)
2. **Giải quyết cặp lớp khó:** Bổ sung dữ liệu đa dạng hơn cho Bánh xèo, áp dụng Focal Loss để tập trung vào mẫu khó
3. **Kiến trúc mạnh hơn:** Thử nghiệm EfficientNet-B5/B7 hoặc Vision Transformer (ViT) khi có GPU mạnh hơn
4. **Multi-label classification:** Nhận diện nhiều món ăn trong cùng một ảnh (mâm cơm)
5. **Model compression:** Quantization/Pruning để triển khai trên thiết bị di động
6. **Continual learning:** Tự động retraining định kỳ với dữ liệu từ feedback loop

---

## Tài liệu tham khảo

1. **EfficientNet:** Tan, M., & Le, Q. (2019). EfficientNet: Rethinking model scaling for convolutional neural networks. _ICML 2019_.
2. **ResNet:** He, K., et al. (2016). Deep residual learning for image recognition. _CVPR 2016_.
3. **InceptionV3:** Szegedy, C., et al. (2016). Rethinking the inception architecture for computer vision. _CVPR 2016_.
4. **AdamW:** Loshchilov, I., & Hutter, F. (2019). Decoupled weight decay regularization. _ICLR 2019_.
5. **Label Smoothing:** Müller, R., et al. (2019). When does label smoothing help? _NeurIPS 2019_.
6. **Transfer Learning Survey:** Zhuang, F., et al. (2020). A comprehensive study of transfer learning. _Proceedings of the IEEE_.
7. **Data Augmentation:** Shorten, C., & Khoshgoftaar, T. (2019). A survey on image data augmentation for deep learning. _Journal of Big Data_.
