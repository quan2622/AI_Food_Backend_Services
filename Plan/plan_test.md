# Kế Hoạch Test Hệ Thống Gợi Ý Theo Từng Phần

## Tóm tắt

Mục tiêu là kiểm thử `recommendation-service` theo đúng pipeline hiện có: nhận request, tải user context và food candidates từ DB, hard filter, hybrid scoring, rerank/diversity, build response, healthcheck, feedback và cache collaborative score.

Phạm vi chốt: backend đầy đủ cho service recommender, gồm unit test, integration test, API contract test, DB/repository test và một lớp sanity E2E khi chạy service với dữ liệu kiểm thử có kiểm soát.

## Các phần cần test

### 1. API contract và validation

- Kiểm tra `GET /health`, `GET /v1/recommendations`, `POST /v1/recommendations/query`, `POST /v1/feedback`.
- Xác nhận mapping status code đúng cho case thành công, `user_id` không tồn tại và request invalid.
- Test normalize `meal_type` không phân biệt hoa thường, nhưng chỉ chấp nhận `BREAKFAST | LUNCH | DINNER | SNACK`.
- Test `limit`, `meal_affinity_threshold`, `exclude_food_ids`, `rating` đúng ràng buộc Pydantic.
- Xác nhận response shape ổn định: `metadata`, `data`, `recommendation_strategy`, `items`, `health_analysis`, `goal_alignment`.

### 2. Repository và truy vấn dữ liệu

- Test `load_user_context` cho 3 nhánh: guest mode (`user_id=None`), user tồn tại, user không tồn tại.
- Test tính đúng `target_nutrition`, `consumed_today`, `remaining_nutrition`, `allergy_warnings`, `repeat_counts`, `total_logs`.
- Test `load_food_candidates` lấy đúng category, nutrition, allergen, meal affinity và popularity.
- Test `load_candidate_collaborative_scores` cho case có lịch sử, không có lịch sử, query lỗi và normalize score.
- Test tương thích schema động: các nhánh `_has_column()` cho tên user và `targetFiber`.
- Dùng DB test cô lập hoặc DB container với seed tối thiểu để kiểm tra SQL thật, không chỉ mock engine.

### 3. Logic recommender và ranking

- Test `HybridRecommender.score` theo từng biến đầu vào:
  - món khớp nutrition cao hơn món lệch nutrition
  - penalty tăng khi lặp món
  - collaborative score làm thay đổi `final_score`
  - dynamic weight thay đổi theo `total_logs`, `goal_type`, `has_cf`
- Test `_apply_hard_filters` cho:
  - loại món có allergen trùng user
  - loại món meal affinity dưới ngưỡng
  - loại món thiếu calories
  - fallback nới ngưỡng khi còn dưới 5 candidates
  - fallback về toàn catalog khi filter rỗng
- Test `_resolve_strategy` cho 3 chiến lược: `popular-fallback`, `content-based-filtering`, `hybrid`.
- Test `_rerank_with_diversity` cho:
  - giới hạn tối đa 2 món/category trước khi đủ top
  - chèn `New Item` quanh vị trí top 3 khi đủ điều kiện
  - không làm vượt `limit`
- Test `_popular_fallback`, `_suggested_portion_grams`, `_goal_alignment`, `_build_reason_and_tags`.

### 4. Service orchestration, cache và feedback

- Test `RecommendationService.get_recommendations` với repository stub/mock để xác nhận thứ tự xử lý và dữ liệu trả về.
- Test cache collaborative:
  - miss cache thì gọi repository
  - hit cache thì không gọi lại query collaborative
  - hết TTL thì query lại
- Test `accept_feedback` hiện chỉ accept và sinh `trace_id`; đánh dấu rõ đây là contract test, chưa có persistence/business effect.
- Test `healthcheck` khi DB up/down và schema trả về đúng config.

### 5. Sanity integration / E2E

- Chạy service với DB test có seed nhỏ nhưng đủ nhánh:
  - 1 user có goal + meal history + allergy
  - 1 user mới ít log
  - 1 user không tồn tại
  - vài món mới tạo gần đây
  - vài món cùng category để test diversity
  - vài món có allergen và vài món không có nutrition
- Gọi API thật và kiểm tra:
  - user có history nhận `hybrid` hoặc `content-based-filtering`
  - user không tồn tại trả 404 business response
  - guest mode vẫn có danh sách gợi ý
  - món dị ứng không xuất hiện
  - món lặp nhiều bị tụt hạng
  - có thể xuất hiện `New Item` đúng cửa sổ ngày
- Thêm 1 sanity check thời gian phản hồi cho top-N nhỏ để phát hiện query/phối hợp bất thường.

## Cách triển khai bộ test

- Giữ 3 lớp test:
  - Unit: `schemas`, `hybrid`, `cache_service`, helper methods trong `RecommendationService`
  - Integration: `RecommendationService` + repository mock/stub và repository + DB test
  - API/E2E: `TestClient` hoặc service chạy cục bộ với seed data
- Tách fixture dùng chung cho:
  - user context chuẩn
  - food candidate chuẩn
  - catalog có allergen / repeat / new item / cùng category
  - DB seed tối thiểu cho SQL thật
- Ưu tiên thêm test mới cho service và repository trước, vì hiện coverage đang thiếu chủ yếu ở hai lớp này.

## Test cases ưu tiên cao

- User có dị ứng và catalog chứa món dị ứng.
- User mới chưa có lịch sử, không có collaborative score.
- User có lịch sử dày, collaborative score cao nhưng món bị repeat penalty.
- Catalog sau hard filter còn dưới 5 món.
- Catalog không còn món nào sau filter.
- Toàn bộ score cuối cùng bằng 0 dẫn đến `popular-fallback`.
- `meal_type` gửi `lunch` thường vẫn được normalize đúng.
- `exclude_food_ids` loại đúng item khỏi kết quả.
- `targetFiber` không có trong schema vẫn không làm vỡ context loading.
- Cache hit/miss/expire cho collaborative score.

## Tiêu chí hoàn thành

- Mỗi phần trên đều có test xanh cho nhánh thành công, nhánh lỗi và nhánh fallback chính.
- Coverage tập trung vào file lõi: service, repository, hybrid recommender, API schema/validation.
- Có dữ liệu seed và hướng dẫn chạy test rõ ràng để người khác chạy lại được.
- Có một danh sách “known gaps” sau test, đặc biệt cho feedback persistence, production cache và hiệu năng lớn.

## Giả định và mặc định đã chốt

- Phạm vi là backend đầy đủ của `recommendation-service`, chưa mở rộng sang frontend hay hệ thống consumer khác.
- Mục tiêu là plan kiểm thử; chưa bao gồm viết test ngay trong turn này.
- DB integration nên dùng dữ liệu kiểm thử có kiểm soát thay vì phụ thuộc dữ liệu thật hiện có.
- Các gap đã nêu trong README như Redis/ALS/pgvector được xem là ngoài phạm vi test chức năng hiện tại, chỉ cần ghi nhận trong known gaps.
