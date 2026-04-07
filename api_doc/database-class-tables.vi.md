# Mô tả bảng của các lớp trong hệ thống

Tài liệu được tổng hợp từ `prisma/schema.prisma`.

## Bảng `all_codes` (lớp `AllCode`)

| STT | Tên thuộc tính | Kiểu dữ liệu | Khóa chính | Khóa ngoại | Được rỗng | Diễn giải |
|---|---|---|---|---|---|---|
| 1 | id | Int | Có | - | Không | Định danh duy nhất của mã tham chiếu. |
| 2 | keyMap | String | Không | - | Không | Mã key duy nhất để tra cứu. |
| 3 | type | String | Không | - | Không | Nhóm mã (loại all code). |
| 4 | value | String | Không | - | Không | Giá trị hiển thị của mã. |
| 5 | description | String | Không | - | Có | Mô tả bổ sung cho mã. |
| 6 | createdAt | DateTime | Không | - | Không | Thời điểm tạo bản ghi. |
| 7 | updatedAt | DateTime | Không | - | Không | Thời điểm cập nhật bản ghi. |

## Bảng `users` (lớp `User`)

| STT | Tên thuộc tính | Kiểu dữ liệu | Khóa chính | Khóa ngoại | Được rỗng | Diễn giải |
|---|---|---|---|---|---|---|
| 1 | id | Int | Có | - | Không | Định danh người dùng. |
| 2 | email | String | Không | - | Không | Email đăng nhập (duy nhất). |
| 3 | password | String | Không | - | Không | Mật khẩu đã mã hóa. |
| 4 | avatarUrl | String | Không | - | Có | Đường dẫn ảnh đại diện. |
| 5 | fullName | String | Không | - | Không | Họ tên người dùng. |
| 6 | accessToken | String (Text) | Không | - | Có | Access token đang lưu. |
| 7 | refreshToken | String (Text) | Không | - | Có | Refresh token đang lưu. |
| 8 | dateOfBirth | DateTime | Không | - | Có | Ngày sinh. |
| 9 | isAdmin | Boolean | Không | - | Không | Có phải tài khoản quản trị hay không. |
| 10 | status | Boolean | Không | - | Không | Trạng thái hoạt động của tài khoản. |
| 11 | createdAt | DateTime | Không | - | Không | Thời điểm tạo tài khoản. |
| 12 | updatedAt | DateTime | Không | - | Không | Thời điểm cập nhật tài khoản. |

## Bảng `user_profiles` (lớp `UserProfile`)

| STT | Tên thuộc tính | Kiểu dữ liệu | Khóa chính | Khóa ngoại | Được rỗng | Diễn giải |
|---|---|---|---|---|---|---|
| 1 | id | Int | Có | - | Không | Định danh profile. |
| 2 | age | Int | Không | - | Không | Tuổi người dùng. |
| 3 | height | Float | Không | - | Không | Chiều cao. |
| 4 | weight | Float | Không | - | Không | Cân nặng. |
| 5 | bmi | Float | Không | - | Không | Chỉ số BMI. |
| 6 | bmr | Float | Không | - | Không | Chỉ số BMR. |
| 7 | tdee | Float | Không | - | Không | Tổng năng lượng tiêu hao/ngày. |
| 8 | gender | GenderType (enum) | Không | - | Không | Giới tính. |
| 9 | activityLevel | String | Không | - | Có | Mức độ vận động. |
| 10 | userId | Int | Không | `users.id` | Không | Khóa ngoại tham chiếu người dùng. |
| 11 | createdAt | DateTime | Không | - | Không | Thời điểm tạo profile. |
| 12 | updatedAt | DateTime | Không | - | Không | Thời điểm cập nhật profile. |

## Bảng `nutrition_goals` (lớp `NutritionGoal`)

| STT | Tên thuộc tính | Kiểu dữ liệu | Khóa chính | Khóa ngoại | Được rỗng | Diễn giải |
|---|---|---|---|---|---|---|
| 1 | id | Int | Có | - | Không | Định danh mục tiêu dinh dưỡng. |
| 2 | goalType | String | Không | - | Không | Loại mục tiêu (giảm/tăng/duy trì). |
| 3 | status | NutritionGoalStatus (enum) | Không | - | Không | Trạng thái mục tiêu. |
| 4 | targetWeight | Float | Không | - | Có | Cân nặng mục tiêu. |
| 5 | targetCalories | Float | Không | - | Không | Calo mục tiêu mỗi ngày. |
| 6 | targetProtein | Float | Không | - | Không | Protein mục tiêu mỗi ngày. |
| 7 | targetCarbs | Float | Không | - | Không | Carbs mục tiêu mỗi ngày. |
| 8 | targetFat | Float | Không | - | Không | Fat mục tiêu mỗi ngày. |
| 9 | targetFiber | Float | Không | - | Không | Chất xơ mục tiêu mỗi ngày. |
| 10 | startDate | DateTime | Không | - | Không | Ngày bắt đầu mục tiêu. |
| 11 | endDate | DateTime | Không | - | Không | Ngày kết thúc mục tiêu. |
| 12 | userId | Int | Không | `users.id` | Không | Người dùng sở hữu mục tiêu. |
| 13 | createdAt | DateTime | Không | - | Không | Thời điểm tạo mục tiêu. |
| 14 | updatedAt | DateTime | Không | - | Không | Thời điểm cập nhật mục tiêu. |

## Bảng `user_allergies` (lớp `UserAllergy`)

| STT | Tên thuộc tính | Kiểu dữ liệu | Khóa chính | Khóa ngoại | Được rỗng | Diễn giải |
|---|---|---|---|---|---|---|
| 1 | id | Int | Có | - | Không | Định danh bản ghi dị ứng của người dùng. |
| 2 | severity | String | Không | - | Không | Mức độ dị ứng. |
| 3 | note | String (Text) | Không | - | Có | Ghi chú bổ sung. |
| 4 | userId | Int | Không | `users.id` | Không | Người dùng bị dị ứng. |
| 5 | allergenId | Int | Không | `allergens.id` | Không | Tác nhân gây dị ứng. |
| 6 | createdAt | DateTime | Không | - | Không | Thời điểm tạo bản ghi. |
| 7 | updatedAt | DateTime | Không | - | Không | Thời điểm cập nhật bản ghi. |

## Bảng `allergens` (lớp `Allergen`)

| STT | Tên thuộc tính | Kiểu dữ liệu | Khóa chính | Khóa ngoại | Được rỗng | Diễn giải |
|---|---|---|---|---|---|---|
| 1 | id | Int | Có | - | Không | Định danh chất gây dị ứng. |
| 2 | name | String | Không | - | Không | Tên chất gây dị ứng (duy nhất). |
| 3 | description | String | Không | - | Có | Mô tả chất gây dị ứng. |
| 4 | createdAt | DateTime | Không | - | Không | Thời điểm tạo bản ghi. |
| 5 | updatedAt | DateTime | Không | - | Không | Thời điểm cập nhật bản ghi. |

## Bảng `ingredients` (lớp `Ingredient`)

| STT | Tên thuộc tính | Kiểu dữ liệu | Khóa chính | Khóa ngoại | Được rỗng | Diễn giải |
|---|---|---|---|---|---|---|
| 1 | id | Int | Có | - | Không | Định danh nguyên liệu. |
| 2 | ingredientName | String | Không | - | Không | Tên nguyên liệu. |
| 3 | description | String | Không | - | Có | Mô tả nguyên liệu. |
| 4 | imageUrl | String | Không | - | Có | Hình ảnh nguyên liệu. |
| 5 | createdAt | DateTime | Không | - | Không | Thời điểm tạo nguyên liệu. |
| 6 | updatedAt | DateTime | Không | - | Không | Thời điểm cập nhật nguyên liệu. |

## Bảng `food_categories` (lớp `FoodCategory`)

| STT | Tên thuộc tính | Kiểu dữ liệu | Khóa chính | Khóa ngoại | Được rỗng | Diễn giải |
|---|---|---|---|---|---|---|
| 1 | id | Int | Có | - | Không | Định danh danh mục món ăn. |
| 2 | name | String | Không | - | Không | Tên danh mục. |
| 3 | description | String | Không | - | Có | Mô tả danh mục. |
| 4 | parentId | Int | Không | `food_categories.id` | Có | Danh mục cha (cấu trúc cây). |

## Bảng `foods` (lớp `Food`)

| STT | Tên thuộc tính | Kiểu dữ liệu | Khóa chính | Khóa ngoại | Được rỗng | Diễn giải |
|---|---|---|---|---|---|---|
| 1 | id | Int | Có | - | Không | Định danh món ăn. |
| 2 | foodName | String | Không | - | Không | Tên món ăn. |
| 3 | description | String | Không | - | Có | Mô tả món ăn. |
| 4 | imageUrl | String | Không | - | Có | Hình ảnh món ăn. |
| 5 | categoryId | Int | Không | `food_categories.id` | Có | Danh mục của món ăn. |
| 6 | defaultServingGrams | Float | Không | - | Có | Khối lượng mặc định của 1 phần ăn. |
| 7 | createdAt | DateTime | Không | - | Không | Thời điểm tạo món ăn. |
| 8 | updatedAt | DateTime | Không | - | Không | Thời điểm cập nhật món ăn. |

## Bảng `food_nutrition_profiles` (lớp `FoodNutritionProfile`)

| STT | Tên thuộc tính | Kiểu dữ liệu | Khóa chính | Khóa ngoại | Được rỗng | Diễn giải |
|---|---|---|---|---|---|---|
| 1 | id | Int | Có | - | Không | Định danh hồ sơ dinh dưỡng của món ăn. |
| 2 | source | String | Không | - | Không | Nguồn dữ liệu dinh dưỡng. |
| 3 | isCalculated | Boolean | Không | - | Không | Dữ liệu có được tính toán hay không. |
| 4 | foodId | Int | Không | `foods.id` | Không | Món ăn được gán hồ sơ dinh dưỡng. |
| 5 | createdAt | DateTime | Không | - | Không | Thời điểm tạo hồ sơ. |
| 6 | updatedAt | DateTime | Không | - | Không | Thời điểm cập nhật hồ sơ. |

## Bảng `food_nutrition_values` (lớp `FoodNutritionValue`)

| STT | Tên thuộc tính | Kiểu dữ liệu | Khóa chính | Khóa ngoại | Được rỗng | Diễn giải |
|---|---|---|---|---|---|---|
| 1 | id | Int | Có | - | Không | Định danh giá trị dinh dưỡng món ăn. |
| 2 | value | Float | Không | - | Không | Giá trị của chất dinh dưỡng. |
| 3 | foodNutritionProfileId | Int | Không | `food_nutrition_profiles.id` | Không | Hồ sơ dinh dưỡng món ăn. |
| 4 | nutrientId | Int | Không | `nutrients.id` | Không | Chất dinh dưỡng tương ứng. |

## Bảng `ingredient_nutritions` (lớp `IngredientNutrition`)

| STT | Tên thuộc tính | Kiểu dữ liệu | Khóa chính | Khóa ngoại | Được rỗng | Diễn giải |
|---|---|---|---|---|---|---|
| 1 | id | Int | Có | - | Không | Định danh hồ sơ dinh dưỡng nguyên liệu. |
| 2 | servingSize | Float | Không | - | Không | Kích thước khẩu phần quy đổi. |
| 3 | servingUnit | String | Không | - | Không | Đơn vị khẩu phần (ví dụ g). |
| 4 | source | String | Không | - | Không | Nguồn dữ liệu dinh dưỡng. |
| 5 | isCalculated | Boolean | Không | - | Không | Dữ liệu có được tính toán hay không. |
| 6 | ingredientId | Int | Không | `ingredients.id` | Không | Nguyên liệu được gán hồ sơ. |
| 7 | createdAt | DateTime | Không | - | Không | Thời điểm tạo hồ sơ. |
| 8 | updatedAt | DateTime | Không | - | Không | Thời điểm cập nhật hồ sơ. |

## Bảng `nutrients` (lớp `Nutrient`)

| STT | Tên thuộc tính | Kiểu dữ liệu | Khóa chính | Khóa ngoại | Được rỗng | Diễn giải |
|---|---|---|---|---|---|---|
| 1 | id | Int | Có | - | Không | Định danh chất dinh dưỡng. |
| 2 | name | String | Không | - | Không | Tên chất dinh dưỡng. |
| 3 | unit | String | Không | - | Không | Đơn vị đo của chất dinh dưỡng. |

## Bảng `nutrition_values` (lớp `NutritionValue`)

| STT | Tên thuộc tính | Kiểu dữ liệu | Khóa chính | Khóa ngoại | Được rỗng | Diễn giải |
|---|---|---|---|---|---|---|
| 1 | id | Int | Có | - | Không | Định danh giá trị dinh dưỡng nguyên liệu. |
| 2 | value | Float | Không | - | Không | Giá trị của chất dinh dưỡng. |
| 3 | ingredientNutritionId | Int | Không | `ingredient_nutritions.id` | Không | Hồ sơ dinh dưỡng nguyên liệu. |
| 4 | nutrientId | Int | Không | `nutrients.id` | Không | Chất dinh dưỡng tương ứng. |

## Bảng `food_ingredients` (lớp `FoodIngredient`)

| STT | Tên thuộc tính | Kiểu dữ liệu | Khóa chính | Khóa ngoại | Được rỗng | Diễn giải |
|---|---|---|---|---|---|---|
| 1 | id | Int | Có | - | Không | Định danh thành phần của món ăn. |
| 2 | quantityGrams | Float | Không | - | Không | Khối lượng nguyên liệu trong món (gram). |
| 3 | foodId | Int | Không | `foods.id` | Không | Món ăn chứa nguyên liệu này. |
| 4 | ingredientId | Int | Không | `ingredients.id` | Không | Nguyên liệu thuộc món ăn. |
| 5 | createdAt | DateTime | Không | - | Không | Thời điểm tạo bản ghi. |
| 6 | updatedAt | DateTime | Không | - | Không | Thời điểm cập nhật bản ghi. |

## Bảng `ingredient_allergens` (lớp `IngredientAllergen`)

| STT | Tên thuộc tính | Kiểu dữ liệu | Khóa chính | Khóa ngoại | Được rỗng | Diễn giải |
|---|---|---|---|---|---|---|
| 1 | id | Int | Có | - | Không | Định danh liên kết nguyên liệu-dị ứng. |
| 2 | ingredientId | Int | Không | `ingredients.id` | Không | Nguyên liệu có tác nhân dị ứng. |
| 3 | allergenId | Int | Không | `allergens.id` | Không | Tác nhân dị ứng liên quan. |
| 4 | createdAt | DateTime | Không | - | Không | Thời điểm tạo liên kết. |
| 5 | updatedAt | DateTime | Không | - | Không | Thời điểm cập nhật liên kết. |

## Bảng `daily_logs` (lớp `DailyLog`)

| STT | Tên thuộc tính | Kiểu dữ liệu | Khóa chính | Khóa ngoại | Được rỗng | Diễn giải |
|---|---|---|---|---|---|---|
| 1 | id | Int | Có | - | Không | Định danh nhật ký ngày. |
| 2 | logDate | DateTime (Date) | Không | - | Không | Ngày ghi nhật ký. |
| 3 | status | String | Không | - | Không | Trạng thái so với mục tiêu dinh dưỡng. |
| 4 | userId | Int | Không | `users.id` | Không | Người dùng sở hữu nhật ký. |
| 5 | createdAt | DateTime | Không | - | Không | Thời điểm tạo nhật ký. |
| 6 | updatedAt | DateTime | Không | - | Không | Thời điểm cập nhật nhật ký. |

## Bảng `meals` (lớp `Meal`)

| STT | Tên thuộc tính | Kiểu dữ liệu | Khóa chính | Khóa ngoại | Được rỗng | Diễn giải |
|---|---|---|---|---|---|---|
| 1 | id | Int | Có | - | Không | Định danh bữa ăn. |
| 2 | mealType | String | Không | - | Không | Loại bữa ăn (sáng/trưa/tối/phụ). |
| 3 | mealDateTime | DateTime | Không | - | Không | Thời điểm ăn bữa này. |
| 4 | dailyLogId | Int | Không | `daily_logs.id` | Không | Nhật ký ngày chứa bữa ăn. |
| 5 | createdAt | DateTime | Không | - | Không | Thời điểm tạo bữa ăn. |
| 6 | updatedAt | DateTime | Không | - | Không | Thời điểm cập nhật bữa ăn. |

## Bảng `meal_items` (lớp `MealItem`)

| STT | Tên thuộc tính | Kiểu dữ liệu | Khóa chính | Khóa ngoại | Được rỗng | Diễn giải |
|---|---|---|---|---|---|---|
| 1 | id | Int | Có | - | Không | Định danh món trong bữa ăn. |
| 2 | quantity | Float | Không | - | Không | Số lượng phần món ăn. |
| 3 | grams | Float | Không | - | Không | Khối lượng thực tế (gram). |
| 4 | calories | Float | Không | - | Không | Năng lượng quy đổi của món. |
| 5 | protein | Float | Không | - | Không | Lượng protein quy đổi. |
| 6 | carbs | Float | Không | - | Không | Lượng carbs quy đổi. |
| 7 | fat | Float | Không | - | Không | Lượng chất béo quy đổi. |
| 8 | fiber | Float | Không | - | Không | Lượng chất xơ quy đổi. |
| 9 | foodId | Int | Không | `foods.id` | Không | Món ăn gốc được tham chiếu. |
| 10 | mealId | Int | Không | `meals.id` | Không | Bữa ăn chứa món này. |
| 11 | createdAt | DateTime | Không | - | Không | Thời điểm tạo meal item. |
| 12 | updatedAt | DateTime | Không | - | Không | Thời điểm cập nhật meal item. |

## Bảng `food_images` (lớp `FoodImage`)

| STT | Tên thuộc tính | Kiểu dữ liệu | Khóa chính | Khóa ngoại | Được rỗng | Diễn giải |
|---|---|---|---|---|---|---|
| 1 | id | Int | Có | - | Không | Định danh hình ảnh món ăn. |
| 2 | imageUrl | String | Không | - | Không | Đường dẫn lưu hình ảnh. |
| 3 | fileName | String | Không | - | Có | Tên tệp hình ảnh. |
| 4 | mimeType | String | Không | - | Có | Định dạng MIME của ảnh. |
| 5 | fileSize | Int | Không | - | Có | Kích thước tệp (byte). |
| 6 | uploadedAt | DateTime | Không | - | Không | Thời điểm tải ảnh lên. |
| 7 | userId | Int | Không | `users.id` | Không | Người dùng tải ảnh. |
| 8 | mealId | Int | Không | `meals.id` | Không | Bữa ăn liên quan ảnh. |

## Bảng `workout_logs` (lớp `WorkoutLog`)

| STT | Tên thuộc tính | Kiểu dữ liệu | Khóa chính | Khóa ngoại | Được rỗng | Diễn giải |
|---|---|---|---|---|---|---|
| 1 | id | Int | Có | - | Không | Định danh nhật ký tập luyện. |
| 2 | userId | Int | Không | `users.id` | Không | Người dùng thực hiện bài tập. |
| 3 | workoutType | String | Không | - | Không | Loại bài tập. |
| 4 | durationMinute | Int | Không | - | Có | Thời lượng tập (phút). |
| 5 | burnedCalories | Float | Không | - | Không | Calo tiêu hao ước tính. |
| 6 | startedAt | DateTime | Không | - | Không | Thời điểm bắt đầu tập. |
| 7 | endedAt | DateTime | Không | - | Có | Thời điểm kết thúc tập. |
| 8 | source | String | Không | - | Có | Nguồn ghi nhận dữ liệu tập. |
| 9 | createdAt | DateTime | Không | - | Không | Thời điểm tạo bản ghi. |
| 10 | updatedAt | DateTime | Không | - | Không | Thời điểm cập nhật bản ghi. |

## Bảng `reports` (lớp `Report`)

| STT | Tên thuộc tính | Kiểu dữ liệu | Khóa chính | Khóa ngoại | Được rỗng | Diễn giải |
|---|---|---|---|---|---|---|
| 1 | id | Int | Có | - | Không | Định danh báo cáo. |
| 2 | reportType | String | Không | - | Không | Loại báo cáo. |
| 3 | generatedAt | DateTime | Không | - | Không | Thời điểm sinh báo cáo. |
| 4 | timeRangeStart | DateTime | Không | - | Không | Mốc bắt đầu dữ liệu tổng hợp. |
| 5 | timeRangeEnd | DateTime | Không | - | Không | Mốc kết thúc dữ liệu tổng hợp. |
| 6 | data | String (Text) | Không | - | Không | Dữ liệu báo cáo dạng chuỗi JSON/Text. |
| 7 | userId | Int | Không | `users.id` | Không | Người dùng sở hữu báo cáo. |
| 8 | createdAt | DateTime | Không | - | Không | Thời điểm tạo báo cáo. |
| 9 | updatedAt | DateTime | Không | - | Không | Thời điểm cập nhật báo cáo. |

## Bảng `ai_models` (lớp `AIModel`)

| STT | Tên thuộc tính | Kiểu dữ liệu | Khóa chính | Khóa ngoại | Được rỗng | Diễn giải |
|---|---|---|---|---|---|---|
| 1 | id | Int | Có | - | Không | Định danh mô hình AI. |
| 2 | version | String | Không | - | Không | Phiên bản mô hình. |
| 3 | accuracy | Decimal | Không | - | Không | Độ chính xác mô hình. |
| 4 | loss | Decimal | Không | - | Không | Giá trị loss của mô hình. |
| 5 | createdAt | DateTime | Không | - | Không | Thời điểm tạo mô hình. |
| 6 | updatedAt | DateTime | Không | - | Không | Thời điểm cập nhật mô hình. |

## Bảng `ai_training_jobs` (lớp `AITrainingJob`)

| STT | Tên thuộc tính | Kiểu dữ liệu | Khóa chính | Khóa ngoại | Được rỗng | Diễn giải |
|---|---|---|---|---|---|---|
| 1 | id | Int | Có | - | Không | Định danh job huấn luyện. |
| 2 | startedAt | DateTime | Không | - | Không | Thời điểm bắt đầu huấn luyện. |
| 3 | finishedAt | DateTime | Không | - | Có | Thời điểm kết thúc huấn luyện. |
| 4 | status | String | Không | - | Không | Trạng thái job huấn luyện. |
| 5 | modelId | Int | Không | `ai_models.id` | Không | Mô hình AI của job. |
| 6 | createdAt | DateTime | Không | - | Không | Thời điểm tạo job. |
| 7 | updatedAt | DateTime | Không | - | Không | Thời điểm cập nhật job. |
