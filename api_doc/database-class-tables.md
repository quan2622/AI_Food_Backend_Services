# Mo ta bang cua cac lop trong he thong

Tai lieu duoc tong hop tu `prisma/schema.prisma`.

## Bang `all_codes` (lop `AllCode`)

| STT | Ten thuoc tinh | Kieu du lieu | Khoa chinh | Khoa ngoai | Duoc rong | Dien giai |
|---|---|---|---|---|---|---|
| 1 | id | Int | Co | - | Khong | Dinh danh duy nhat cua ma tham chieu. |
| 2 | keyMap | String | Khong | - | Khong | Ma key duy nhat de tra cuu. |
| 3 | type | String | Khong | - | Khong | Nhom ma (loai all code). |
| 4 | value | String | Khong | - | Khong | Gia tri hien thi cua ma. |
| 5 | description | String | Khong | - | Co | Mo ta bo sung cho ma. |
| 6 | createdAt | DateTime | Khong | - | Khong | Thoi diem tao ban ghi. |
| 7 | updatedAt | DateTime | Khong | - | Khong | Thoi diem cap nhat ban ghi. |

## Bang `users` (lop `User`)

| STT | Ten thuoc tinh | Kieu du lieu | Khoa chinh | Khoa ngoai | Duoc rong | Dien giai |
|---|---|---|---|---|---|---|
| 1 | id | Int | Co | - | Khong | Dinh danh nguoi dung. |
| 2 | email | String | Khong | - | Khong | Email dang nhap (duy nhat). |
| 3 | password | String | Khong | - | Khong | Mat khau da ma hoa. |
| 4 | avatarUrl | String | Khong | - | Co | Duong dan anh dai dien. |
| 5 | fullName | String | Khong | - | Khong | Ho ten nguoi dung. |
| 6 | accessToken | String (Text) | Khong | - | Co | Access token dang luu. |
| 7 | refreshToken | String (Text) | Khong | - | Co | Refresh token dang luu. |
| 8 | dateOfBirth | DateTime | Khong | - | Co | Ngay sinh. |
| 9 | isAdmin | Boolean | Khong | - | Khong | Co phai tai khoan quan tri hay khong. |
| 10 | status | Boolean | Khong | - | Khong | Trang thai hoat dong cua tai khoan. |
| 11 | createdAt | DateTime | Khong | - | Khong | Thoi diem tao tai khoan. |
| 12 | updatedAt | DateTime | Khong | - | Khong | Thoi diem cap nhat tai khoan. |

## Bang `user_profiles` (lop `UserProfile`)

| STT | Ten thuoc tinh | Kieu du lieu | Khoa chinh | Khoa ngoai | Duoc rong | Dien giai |
|---|---|---|---|---|---|---|
| 1 | id | Int | Co | - | Khong | Dinh danh profile. |
| 2 | age | Int | Khong | - | Khong | Tuoi nguoi dung. |
| 3 | height | Float | Khong | - | Khong | Chieu cao. |
| 4 | weight | Float | Khong | - | Khong | Can nang. |
| 5 | bmi | Float | Khong | - | Khong | Chi so BMI. |
| 6 | bmr | Float | Khong | - | Khong | Chi so BMR. |
| 7 | tdee | Float | Khong | - | Khong | Tong nang luong tieu hao/ngay. |
| 8 | gender | GenderType (enum) | Khong | - | Khong | Gioi tinh. |
| 9 | activityLevel | String | Khong | - | Co | Muc do van dong. |
| 10 | userId | Int | Khong | `users.id` | Khong | Khoa ngoai tham chieu nguoi dung. |
| 11 | createdAt | DateTime | Khong | - | Khong | Thoi diem tao profile. |
| 12 | updatedAt | DateTime | Khong | - | Khong | Thoi diem cap nhat profile. |

## Bang `nutrition_goals` (lop `NutritionGoal`)

| STT | Ten thuoc tinh | Kieu du lieu | Khoa chinh | Khoa ngoai | Duoc rong | Dien giai |
|---|---|---|---|---|---|---|
| 1 | id | Int | Co | - | Khong | Dinh danh muc tieu dinh duong. |
| 2 | goalType | String | Khong | - | Khong | Loai muc tieu (giam/tang/duy tri). |
| 3 | status | NutritionGoalStatus (enum) | Khong | - | Khong | Trang thai muc tieu. |
| 4 | targetWeight | Float | Khong | - | Co | Can nang muc tieu. |
| 5 | targetCalories | Float | Khong | - | Khong | Calo muc tieu moi ngay. |
| 6 | targetProtein | Float | Khong | - | Khong | Protein muc tieu moi ngay. |
| 7 | targetCarbs | Float | Khong | - | Khong | Carbs muc tieu moi ngay. |
| 8 | targetFat | Float | Khong | - | Khong | Fat muc tieu moi ngay. |
| 9 | targetFiber | Float | Khong | - | Khong | Chat xo muc tieu moi ngay. |
| 10 | startDate | DateTime | Khong | - | Khong | Ngay bat dau muc tieu. |
| 11 | endDate | DateTime | Khong | - | Khong | Ngay ket thuc muc tieu. |
| 12 | userId | Int | Khong | `users.id` | Khong | Nguoi dung so huu muc tieu. |
| 13 | createdAt | DateTime | Khong | - | Khong | Thoi diem tao muc tieu. |
| 14 | updatedAt | DateTime | Khong | - | Khong | Thoi diem cap nhat muc tieu. |

## Bang `user_allergies` (lop `UserAllergy`)

| STT | Ten thuoc tinh | Kieu du lieu | Khoa chinh | Khoa ngoai | Duoc rong | Dien giai |
|---|---|---|---|---|---|---|
| 1 | id | Int | Co | - | Khong | Dinh danh ban ghi di ung cua nguoi dung. |
| 2 | severity | String | Khong | - | Khong | Muc do di ung. |
| 3 | note | String (Text) | Khong | - | Co | Ghi chu bo sung. |
| 4 | userId | Int | Khong | `users.id` | Khong | Nguoi dung bi di ung. |
| 5 | allergenId | Int | Khong | `allergens.id` | Khong | Tac nhan gay di ung. |
| 6 | createdAt | DateTime | Khong | - | Khong | Thoi diem tao ban ghi. |
| 7 | updatedAt | DateTime | Khong | - | Khong | Thoi diem cap nhat ban ghi. |

## Bang `allergens` (lop `Allergen`)

| STT | Ten thuoc tinh | Kieu du lieu | Khoa chinh | Khoa ngoai | Duoc rong | Dien giai |
|---|---|---|---|---|---|---|
| 1 | id | Int | Co | - | Khong | Dinh danh chat gay di ung. |
| 2 | name | String | Khong | - | Khong | Ten chat gay di ung (duy nhat). |
| 3 | description | String | Khong | - | Co | Mo ta chat gay di ung. |
| 4 | createdAt | DateTime | Khong | - | Khong | Thoi diem tao ban ghi. |
| 5 | updatedAt | DateTime | Khong | - | Khong | Thoi diem cap nhat ban ghi. |

## Bang `ingredients` (lop `Ingredient`)

| STT | Ten thuoc tinh | Kieu du lieu | Khoa chinh | Khoa ngoai | Duoc rong | Dien giai |
|---|---|---|---|---|---|---|
| 1 | id | Int | Co | - | Khong | Dinh danh nguyen lieu. |
| 2 | ingredientName | String | Khong | - | Khong | Ten nguyen lieu. |
| 3 | description | String | Khong | - | Co | Mo ta nguyen lieu. |
| 4 | imageUrl | String | Khong | - | Co | Hinh anh nguyen lieu. |
| 5 | createdAt | DateTime | Khong | - | Khong | Thoi diem tao nguyen lieu. |
| 6 | updatedAt | DateTime | Khong | - | Khong | Thoi diem cap nhat nguyen lieu. |

## Bang `food_categories` (lop `FoodCategory`)

| STT | Ten thuoc tinh | Kieu du lieu | Khoa chinh | Khoa ngoai | Duoc rong | Dien giai |
|---|---|---|---|---|---|---|
| 1 | id | Int | Co | - | Khong | Dinh danh danh muc mon an. |
| 2 | name | String | Khong | - | Khong | Ten danh muc. |
| 3 | description | String | Khong | - | Co | Mo ta danh muc. |
| 4 | parentId | Int | Khong | `food_categories.id` | Co | Danh muc cha (cau truc cay). |

## Bang `foods` (lop `Food`)

| STT | Ten thuoc tinh | Kieu du lieu | Khoa chinh | Khoa ngoai | Duoc rong | Dien giai |
|---|---|---|---|---|---|---|
| 1 | id | Int | Co | - | Khong | Dinh danh mon an. |
| 2 | foodName | String | Khong | - | Khong | Ten mon an. |
| 3 | description | String | Khong | - | Co | Mo ta mon an. |
| 4 | imageUrl | String | Khong | - | Co | Hinh anh mon an. |
| 5 | categoryId | Int | Khong | `food_categories.id` | Co | Danh muc cua mon an. |
| 6 | defaultServingGrams | Float | Khong | - | Co | Khoi luong mac dinh cua 1 phan an. |
| 7 | createdAt | DateTime | Khong | - | Khong | Thoi diem tao mon an. |
| 8 | updatedAt | DateTime | Khong | - | Khong | Thoi diem cap nhat mon an. |

## Bang `food_nutrition_profiles` (lop `FoodNutritionProfile`)

| STT | Ten thuoc tinh | Kieu du lieu | Khoa chinh | Khoa ngoai | Duoc rong | Dien giai |
|---|---|---|---|---|---|---|
| 1 | id | Int | Co | - | Khong | Dinh danh ho so dinh duong cua mon an. |
| 2 | source | String | Khong | - | Khong | Nguon du lieu dinh duong. |
| 3 | isCalculated | Boolean | Khong | - | Khong | Du lieu co duoc tinh toan hay khong. |
| 4 | foodId | Int | Khong | `foods.id` | Khong | Mon an duoc gan ho so dinh duong. |
| 5 | createdAt | DateTime | Khong | - | Khong | Thoi diem tao ho so. |
| 6 | updatedAt | DateTime | Khong | - | Khong | Thoi diem cap nhat ho so. |

## Bang `food_nutrition_values` (lop `FoodNutritionValue`)

| STT | Ten thuoc tinh | Kieu du lieu | Khoa chinh | Khoa ngoai | Duoc rong | Dien giai |
|---|---|---|---|---|---|---|
| 1 | id | Int | Co | - | Khong | Dinh danh gia tri dinh duong mon an. |
| 2 | value | Float | Khong | - | Khong | Gia tri cua chat dinh duong. |
| 3 | foodNutritionProfileId | Int | Khong | `food_nutrition_profiles.id` | Khong | Ho so dinh duong mon an. |
| 4 | nutrientId | Int | Khong | `nutrients.id` | Khong | Chat dinh duong tuong ung. |

## Bang `ingredient_nutritions` (lop `IngredientNutrition`)

| STT | Ten thuoc tinh | Kieu du lieu | Khoa chinh | Khoa ngoai | Duoc rong | Dien giai |
|---|---|---|---|---|---|---|
| 1 | id | Int | Co | - | Khong | Dinh danh ho so dinh duong nguyen lieu. |
| 2 | servingSize | Float | Khong | - | Khong | Kich thuoc khau phan quy doi. |
| 3 | servingUnit | String | Khong | - | Khong | Don vi khau phan (vi du g). |
| 4 | source | String | Khong | - | Khong | Nguon du lieu dinh duong. |
| 5 | isCalculated | Boolean | Khong | - | Khong | Du lieu co duoc tinh toan hay khong. |
| 6 | ingredientId | Int | Khong | `ingredients.id` | Khong | Nguyen lieu duoc gan ho so. |
| 7 | createdAt | DateTime | Khong | - | Khong | Thoi diem tao ho so. |
| 8 | updatedAt | DateTime | Khong | - | Khong | Thoi diem cap nhat ho so. |

## Bang `nutrients` (lop `Nutrient`)

| STT | Ten thuoc tinh | Kieu du lieu | Khoa chinh | Khoa ngoai | Duoc rong | Dien giai |
|---|---|---|---|---|---|---|
| 1 | id | Int | Co | - | Khong | Dinh danh chat dinh duong. |
| 2 | name | String | Khong | - | Khong | Ten chat dinh duong. |
| 3 | unit | String | Khong | - | Khong | Don vi do cua chat dinh duong. |

## Bang `nutrition_values` (lop `NutritionValue`)

| STT | Ten thuoc tinh | Kieu du lieu | Khoa chinh | Khoa ngoai | Duoc rong | Dien giai |
|---|---|---|---|---|---|---|
| 1 | id | Int | Co | - | Khong | Dinh danh gia tri dinh duong nguyen lieu. |
| 2 | value | Float | Khong | - | Khong | Gia tri cua chat dinh duong. |
| 3 | ingredientNutritionId | Int | Khong | `ingredient_nutritions.id` | Khong | Ho so dinh duong nguyen lieu. |
| 4 | nutrientId | Int | Khong | `nutrients.id` | Khong | Chat dinh duong tuong ung. |

## Bang `food_ingredients` (lop `FoodIngredient`)

| STT | Ten thuoc tinh | Kieu du lieu | Khoa chinh | Khoa ngoai | Duoc rong | Dien giai |
|---|---|---|---|---|---|---|
| 1 | id | Int | Co | - | Khong | Dinh danh thanh phan cua mon an. |
| 2 | quantityGrams | Float | Khong | - | Khong | Khoi luong nguyen lieu trong mon (gram). |
| 3 | foodId | Int | Khong | `foods.id` | Khong | Mon an chua nguyen lieu nay. |
| 4 | ingredientId | Int | Khong | `ingredients.id` | Khong | Nguyen lieu thuoc mon an. |
| 5 | createdAt | DateTime | Khong | - | Khong | Thoi diem tao ban ghi. |
| 6 | updatedAt | DateTime | Khong | - | Khong | Thoi diem cap nhat ban ghi. |

## Bang `ingredient_allergens` (lop `IngredientAllergen`)

| STT | Ten thuoc tinh | Kieu du lieu | Khoa chinh | Khoa ngoai | Duoc rong | Dien giai |
|---|---|---|---|---|---|---|
| 1 | id | Int | Co | - | Khong | Dinh danh lien ket nguyen lieu-di ung. |
| 2 | ingredientId | Int | Khong | `ingredients.id` | Khong | Nguyen lieu co tac nhan di ung. |
| 3 | allergenId | Int | Khong | `allergens.id` | Khong | Tac nhan di ung lien quan. |
| 4 | createdAt | DateTime | Khong | - | Khong | Thoi diem tao lien ket. |
| 5 | updatedAt | DateTime | Khong | - | Khong | Thoi diem cap nhat lien ket. |

## Bang `daily_logs` (lop `DailyLog`)

| STT | Ten thuoc tinh | Kieu du lieu | Khoa chinh | Khoa ngoai | Duoc rong | Dien giai |
|---|---|---|---|---|---|---|
| 1 | id | Int | Co | - | Khong | Dinh danh nhat ky ngay. |
| 2 | logDate | DateTime (Date) | Khong | - | Khong | Ngay ghi nhat ky. |
| 3 | status | String | Khong | - | Khong | Trang thai so voi muc tieu dinh duong. |
| 4 | userId | Int | Khong | `users.id` | Khong | Nguoi dung so huu nhat ky. |
| 5 | createdAt | DateTime | Khong | - | Khong | Thoi diem tao nhat ky. |
| 6 | updatedAt | DateTime | Khong | - | Khong | Thoi diem cap nhat nhat ky. |

## Bang `meals` (lop `Meal`)

| STT | Ten thuoc tinh | Kieu du lieu | Khoa chinh | Khoa ngoai | Duoc rong | Dien giai |
|---|---|---|---|---|---|---|
| 1 | id | Int | Co | - | Khong | Dinh danh bua an. |
| 2 | mealType | String | Khong | - | Khong | Loai bua an (sang/trua/toi/phu). |
| 3 | mealDateTime | DateTime | Khong | - | Khong | Thoi diem an bua nay. |
| 4 | dailyLogId | Int | Khong | `daily_logs.id` | Khong | Nhat ky ngay chua bua an. |
| 5 | createdAt | DateTime | Khong | - | Khong | Thoi diem tao bua an. |
| 6 | updatedAt | DateTime | Khong | - | Khong | Thoi diem cap nhat bua an. |

## Bang `meal_items` (lop `MealItem`)

| STT | Ten thuoc tinh | Kieu du lieu | Khoa chinh | Khoa ngoai | Duoc rong | Dien giai |
|---|---|---|---|---|---|---|
| 1 | id | Int | Co | - | Khong | Dinh danh mon trong bua an. |
| 2 | quantity | Float | Khong | - | Khong | So luong phan mon an. |
| 3 | grams | Float | Khong | - | Khong | Khoi luong thuc te (gram). |
| 4 | calories | Float | Khong | - | Khong | Nang luong quy doi cua mon. |
| 5 | protein | Float | Khong | - | Khong | Luong protein quy doi. |
| 6 | carbs | Float | Khong | - | Khong | Luong carbs quy doi. |
| 7 | fat | Float | Khong | - | Khong | Luong chat beo quy doi. |
| 8 | fiber | Float | Khong | - | Khong | Luong chat xo quy doi. |
| 9 | foodId | Int | Khong | `foods.id` | Khong | Mon an goc duoc tham chieu. |
| 10 | mealId | Int | Khong | `meals.id` | Khong | Bua an chua mon nay. |
| 11 | createdAt | DateTime | Khong | - | Khong | Thoi diem tao meal item. |
| 12 | updatedAt | DateTime | Khong | - | Khong | Thoi diem cap nhat meal item. |

## Bang `food_images` (lop `FoodImage`)

| STT | Ten thuoc tinh | Kieu du lieu | Khoa chinh | Khoa ngoai | Duoc rong | Dien giai |
|---|---|---|---|---|---|---|
| 1 | id | Int | Co | - | Khong | Dinh danh hinh anh mon an. |
| 2 | imageUrl | String | Khong | - | Khong | Duong dan luu hinh anh. |
| 3 | fileName | String | Khong | - | Co | Ten tep hinh anh. |
| 4 | mimeType | String | Khong | - | Co | Dinh dang MIME cua anh. |
| 5 | fileSize | Int | Khong | - | Co | Kich thuoc tep (byte). |
| 6 | uploadedAt | DateTime | Khong | - | Khong | Thoi diem tai anh len. |
| 7 | userId | Int | Khong | `users.id` | Khong | Nguoi dung tai anh. |
| 8 | mealId | Int | Khong | `meals.id` | Khong | Bua an lien quan anh. |

## Bang `workout_logs` (lop `WorkoutLog`)

| STT | Ten thuoc tinh | Kieu du lieu | Khoa chinh | Khoa ngoai | Duoc rong | Dien giai |
|---|---|---|---|---|---|---|
| 1 | id | Int | Co | - | Khong | Dinh danh nhat ky tap luyen. |
| 2 | userId | Int | Khong | `users.id` | Khong | Nguoi dung thuc hien bai tap. |
| 3 | workoutType | String | Khong | - | Khong | Loai bai tap. |
| 4 | durationMinute | Int | Khong | - | Co | Thoi luong tap (phut). |
| 5 | burnedCalories | Float | Khong | - | Khong | Calo tieu hao uoc tinh. |
| 6 | startedAt | DateTime | Khong | - | Khong | Thoi diem bat dau tap. |
| 7 | endedAt | DateTime | Khong | - | Co | Thoi diem ket thuc tap. |
| 8 | source | String | Khong | - | Co | Nguon ghi nhan du lieu tap. |
| 9 | createdAt | DateTime | Khong | - | Khong | Thoi diem tao ban ghi. |
| 10 | updatedAt | DateTime | Khong | - | Khong | Thoi diem cap nhat ban ghi. |

## Bang `reports` (lop `Report`)

| STT | Ten thuoc tinh | Kieu du lieu | Khoa chinh | Khoa ngoai | Duoc rong | Dien giai |
|---|---|---|---|---|---|---|
| 1 | id | Int | Co | - | Khong | Dinh danh bao cao. |
| 2 | reportType | String | Khong | - | Khong | Loai bao cao. |
| 3 | generatedAt | DateTime | Khong | - | Khong | Thoi diem sinh bao cao. |
| 4 | timeRangeStart | DateTime | Khong | - | Khong | Moc bat dau du lieu tong hop. |
| 5 | timeRangeEnd | DateTime | Khong | - | Khong | Moc ket thuc du lieu tong hop. |
| 6 | data | String (Text) | Khong | - | Khong | Du lieu bao cao dang chuoi JSON/Text. |
| 7 | userId | Int | Khong | `users.id` | Khong | Nguoi dung so huu bao cao. |
| 8 | createdAt | DateTime | Khong | - | Khong | Thoi diem tao bao cao. |
| 9 | updatedAt | DateTime | Khong | - | Khong | Thoi diem cap nhat bao cao. |

## Bang `ai_models` (lop `AIModel`)

| STT | Ten thuoc tinh | Kieu du lieu | Khoa chinh | Khoa ngoai | Duoc rong | Dien giai |
|---|---|---|---|---|---|---|
| 1 | id | Int | Co | - | Khong | Dinh danh mo hinh AI. |
| 2 | version | String | Khong | - | Khong | Phien ban mo hinh. |
| 3 | accuracy | Decimal | Khong | - | Khong | Do chinh xac mo hinh. |
| 4 | loss | Decimal | Khong | - | Khong | Gia tri loss cua mo hinh. |
| 5 | createdAt | DateTime | Khong | - | Khong | Thoi diem tao mo hinh. |
| 6 | updatedAt | DateTime | Khong | - | Khong | Thoi diem cap nhat mo hinh. |

## Bang `ai_training_jobs` (lop `AITrainingJob`)

| STT | Ten thuoc tinh | Kieu du lieu | Khoa chinh | Khoa ngoai | Duoc rong | Dien giai |
|---|---|---|---|---|---|---|
| 1 | id | Int | Co | - | Khong | Dinh danh job huan luyen. |
| 2 | startedAt | DateTime | Khong | - | Khong | Thoi diem bat dau huan luyen. |
| 3 | finishedAt | DateTime | Khong | - | Co | Thoi diem ket thuc huan luyen. |
| 4 | status | String | Khong | - | Khong | Trang thai job huan luyen. |
| 5 | modelId | Int | Khong | `ai_models.id` | Khong | Mo hinh AI cua job. |
| 6 | createdAt | DateTime | Khong | - | Khong | Thoi diem tao job. |
| 7 | updatedAt | DateTime | Khong | - | Khong | Thoi diem cap nhat job. |
