const fs = require('fs');
const path = require('path');

const ingredientsList = [
  "Trứng", "Hải sản có vỏ", "Cá", "Gluten", "Sữa", "Đậu phộng", "Tôm", "Cua", "Mè (vừng)", "Đậu nành",
  "Thịt bò", "Thịt lợn", "Thịt gà", "Gạo tẻ", "Gạo nếp", "Bánh phở", "Bún", "Mực", "Đậu hũ", "Rau muống",
  "Cà chua", "Hành lá", "Nấm", "Khoai tây", "Cà rốt", "Hành tây", "Sả", "Ớt", "Tỏi", "Ngò rí",
  "Nước mắm", "Mắm tôm", "Xương ống", "Chả lụa", "Sườn non", "Măng", "Rau thơm", "Bắp cải", "Cải thảo", "Bí đỏ",
  "Tôm khô", "Lạp xưởng", "Trứng cút", "Bánh tráng", "Gừng", "Chanh", "Nước cốt dừa", "Bơ", "Đậu xanh", "Đậu đỏ",
  "Hạt sen", "Củ sắn", "Thịt vịt", "Cá lóc", "Ngao (Nghêu)", "Bột mì", "Bột năng", "Bột bắp", "Đường", "Muối"
];

const ingredientsOutput = ingredientsList.map(name => ({ ingredientName: name, imageUrl: "" }));
const ingredientsJsonPath = path.join(__dirname, 'ingredients_output.json');
fs.writeFileSync(ingredientsJsonPath, JSON.stringify(ingredientsOutput, null, 2));

console.log(`Updated ${ingredientsJsonPath}`);

const foodToIngredients = {
  "Phở bò tái": ["Thịt bò", "Bánh phở", "Hành lá", "Xương ống", "Gừng"],
  "Bún bò Huế": ["Thịt bò", "Bún", "Sả", "Mắm tôm", "Xương ống"],
  "Bún riêu cua": ["Cua", "Bún", "Cà chua", "Đậu hũ", "Hành lá"],
  "Bún thịt nướng": ["Thịt lợn", "Bún", "Đậu phộng", "Rau thơm", "Nước mắm"],
  "Bún mắm": ["Cá", "Bún", "Mực", "Tôm", "Mắm tôm"],
  "Bún đậu mắm tôm": ["Đậu hũ", "Bún", "Thịt lợn", "Mắm tôm", "Chả lụa"],
  "Bún cá": ["Cá", "Bún", "Cà chua", "Hành lá", "Nước mắm"],
  "Bún chả Hà Nội": ["Thịt lợn", "Bún", "Nước mắm", "Đu đủ", "Rau thơm"],
  "Cơm tấm sườn bì chả": ["Gạo tẻ", "Thịt lợn", "Trứng", "Nước mắm", "Hành lá"],
  "Cơm chiên dương châu": ["Gạo tẻ", "Trứng", "Lạp xưởng", "Tôm khô", "Hành lá"],
  "Cơm gà Hội An": ["Thịt gà", "Gạo tẻ", "Hành tây", "Rau thơm", "Nước mắm"],
  "Cơm gà xối mỡ": ["Thịt gà", "Gạo tẻ", "Cà chua", "Tỏi", "Nước mắm"],
  "Cơm sườn nướng mật ong": ["Thịt lợn", "Gạo tẻ", "Nước mắm", "Mật ong", "Hành lá"],
  "Cơm chiên hải sản": ["Gạo tẻ", "Tôm", "Mực", "Trứng", "Hành lá"],
  "Phở gà": ["Thịt gà", "Bánh phở", "Hành lá", "Gừng", "Xương ống"],
  "Phở cuốn": ["Thịt bò", "Bánh phở", "Rau thơm", "Nước mắm", "Tỏi"],
  "Mì Quảng": ["Thịt gà", "Bánh phở", "Tôm", "Đậu phộng", "Bánh tráng"],
  "Hủ tiếu Nam Vang": ["Thịt lợn", "Tôm", "Bánh phở", "Trứng cút", "Hành lá"],
  "Cao lầu Hội An": ["Thịt lợn", "Bánh phở", "Rau thơm", "Nước mắm", "Đậu phộng"],
  "Mì xào hải sản": ["Mực", "Tôm", "Bột mì", "Cải thảo", "Cà rốt"],
  "Bánh mì thịt nguội": ["Bột mì", "Thịt lợn", "Chả lụa", "Rau thơm", "Ớt"],
  "Bánh mì xíu mại": ["Bột mì", "Thịt lợn", "Cà chua", "Hành lá", "Tỏi"],
  "Bánh mì ốp la": ["Bột mì", "Trứng", "Nước mắm", "Hành lá", "Cà chua"],
  "Bánh bao nhân thịt": ["Bột mì", "Thịt lợn", "Trứng cút", "Nấm", "Hành tây"],
  "Gỏi cuốn tôm thịt": ["Tôm", "Thịt lợn", "Bánh tráng", "Bún", "Rau thơm"],
  "Gỏi cuốn chay": ["Đậu hũ", "Bánh tráng", "Bún", "Rau thơm", "Cà rốt"],
  "Nộm đu đủ bò khô": ["Thịt bò", "Đu đủ", "Đậu phộng", "Rau thơm", "Nước mắm"],
  "Gỏi ngó sen tôm thịt": ["Tôm", "Thịt lợn", "Ngó sen", "Nước mắm", "Đậu phộng"],
  "Gỏi gà bắp cải": ["Thịt gà", "Bắp cải", "Hành tây", "Rau thơm", "Nước mắm"],
  "Canh khổ qua dồn thịt": ["Thịt lợn", "Khổ qua", "Hành lá", "Nước mắm", "Nấm"],
  "Canh chua cá": ["Cá", "Cà chua", "Bạc hà", "Khóm", "Hành lá"],
  "Súp bí đỏ": ["Bí đỏ", "Sữa", "Bơ", "Hành tây", "Tỏi"],
  "Canh rau ngót thịt bằm": ["Thịt lợn", "Rau ngót", "Nước mắm", "Hành lá", "Tỏi"],
  "Lẩu thái hải sản": ["Tôm", "Mực", "Ngao (Nghêu)", "Sả", "Cà chua"],
  "Lẩu bò nhúng dấm": ["Thịt bò", "Giấm", "Sả", "Hành tây", "Bún"],
  "Lẩu mắm miền Tây": ["Cá", "Mực", "Tôm", "Mắm tôm", "Bún"],
  "Gà nướng lá chanh": ["Thịt gà", "Lá chanh", "Tỏi", "Ớt", "Nước mắm"],
  "Tôm nướng muối ớt": ["Tôm", "Muối", "Ớt", "Tỏi", "Dầu ăn"],
  "Mực nướng sa tế": ["Mực", "Sa tế", "Tỏi", "Dầu ăn", "Hành lá"],
  "Sườn nướng mật ong": ["Thịt lợn", "Mật ong", "Nước mắm", "Tỏi", "Hành lá"],
  "Cá nướng giấy bạc": ["Cá", "Sả", "Hành lá", "Ớt", "Tỏi"],
  "Bò lúc lắc": ["Thịt bò", "Hành tây", "Cà chua", "Khoai tây", "Tỏi"],
  "Rau muống xào tỏi": ["Rau muống", "Tỏi", "Dầu ăn", "Nước mắm", "Muối"],
  "Trứng hấp thịt bằm": ["Trứng", "Thịt lợn", "Hành lá", "Nước mắm", "Nấm"],
  "Bắp cải xào thịt bò": ["Thịt bò", "Bắp cải", "Tỏi", "Dầu ăn", "Nước mắm"],
  "Đậu phụ xào sả ớt": ["Đậu hũ", "Sả", "Ớt", "Dầu ăn", "Nước mắm"],
  "Cải thảo xào tôm": ["Tôm", "Cải thảo", "Tỏi", "Dầu ăn", "Hành lá"],
  "Cháo gà": ["Gạo tẻ", "Thịt gà", "Hành lá", "Gừng", "Tiêu"],
  "Cháo đậu xanh": ["Gạo tẻ", "Đậu xanh", "Đường", "Nước cốt dừa", "Muối"],
  "Cháo lòng": ["Gạo tẻ", "Thịt lợn", "Hành lá", "Tiêu", "Nước mắm"],
  "Cháo cá lóc": ["Gạo tẻ", "Cá lóc", "Hành lá", "Gừng", "Nước mắm"],
  "Cháo bò": ["Gạo tẻ", "Thịt bò", "Hành lá", "Gừng", "Nước mắm"],
  "Bánh cuốn nhân thịt": ["Bột gạo", "Thịt lợn", "Nấm", "Hành lá", "Nước mắm"],
  "Xôi gà": ["Gạo nếp", "Thịt gà", "Hành phi", "Mỡ hành", "Nước mắm"],
  "Xôi xéo": ["Gạo nếp", "Đậu xanh", "Hành phi", "Mỡ gà", "Muối"],
  "Bánh bèo": ["Bột gạo", "Tôm khô", "Hành lá", "Nước mắm", "Mỡ hành"],
  "Bánh tráng nướng": ["Bánh tráng", "Trứng", "Trứng cút", "Hành lá", "Tép khô"],
  "Bánh ướt": ["Bột gạo", "Chả lụa", "Hành lá", "Nước mắm", "Mỡ hành"],
  "Bánh khọt": ["Bột gạo", "Tôm", "Nước cốt dừa", "Hành lá", "Nước mắm"],
  "Bánh xèo": ["Bột gạo", "Tôm", "Thịt lợn", "Giá đỗ", "Nước cốt dừa"],
  "Thịt kho tàu": ["Thịt lợn", "Trứng", "Nước dừa", "Nước mắm", "Hành lá"],
  "Cá kho tộ": ["Cá", "Nước mắm", "Đường", "Tiêu", "Hành lá"],
  "Bò kho bánh mì": ["Thịt bò", "Bột mì", "Cà rốt", "Sả", "Nước dừa"],
  "Sườn hầm củ cải": ["Thịt lợn", "Củ cải trắng", "Hành lá", "Nước mắm", "Tiêu"],
  "Nem rán (chả giò)": ["Thịt lợn", "Bánh tráng", "Trứng", "Nấm", "Hành tây"],
  "Chả giò hải sản": ["Tôm", "Mực", "Bánh tráng", "Trứng", "Hành tây"],
  "Tôm chiên giòn": ["Tôm", "Bột chiên giòn", "Trứng", "Dầu ăn", "Tương ớt"],
  "Đậu hũ chiên": ["Đậu hũ", "Dầu ăn", "Nước mắm", "Hành lá", "Cà chua"],
  "Chè đậu đỏ": ["Đậu đỏ", "Đường", "Nước cốt dừa", "Bột năng", "Dừa nạo"],
  "Chè trôi nước": ["Bột nếp", "Đậu xanh", "Đường", "Gừng", "Nước cốt dừa"],
  "Chè bắp": ["Bắp", "Đường", "Nước cốt dừa", "Bột năng", "Lá dứa"],
  "Chè thái": ["Sầu riêng", "Sữa", "Đường", "Bột năng", "Nước cốt dừa"],
  "Bánh tráng trộn": ["Bánh tráng", "Khô bò", "Trứng cút", "Tép khô", "Rau răm"],
  "Dưa hấu & trái cây": ["Dưa hấu", "Trái cây khác", "Đường", "Sữa", "Đá"],
  "Bánh flan": ["Trứng", "Sữa", "Đường", "Cà phê", "Vani"],
  "Sinh tố bơ": ["Bơ", "Sữa", "Đường", "Đá", "Sữa đặc"],
  "Nước mía": ["Mía", "Tắc", "Đá", "Đường", "Muối"],
  "Trà sữa trân châu": ["Trà", "Sữa", "Trân châu", "Đường", "Đá"],
  "Cà phê sữa đá": ["Cà phê", "Sữa đặc", "Đá", "Đường", "Nước sôi"],
  "Nước dừa tươi": ["Dừa", "Đường", "Đá", "Nước cốt dừa", "Muối"],
  "Bún hải sản Phú Quốc": ["Mực", "Tôm", "Bún", "Cà chua", "Sả"],
  "Bánh căn Phan Rang": ["Bột gạo", "Trứng", "Tôm", "Nước mắm", "Hành lá"],
  "Cháo hến Huế": ["Gạo tẻ", "Hến", "Hành lá", "Nước mắm", "Rau răm"]
};

// Update seed files to include ingredients arrays
const updateFile = (filePath) => {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(/(foodName:\s*'([^']+)',)(\s*classKey:.*?,)?(\s*imageUrl:.*?,)?/g, (match, p1, p2, p3, p4) => {
      const ings = foodToIngredients[p2] || [];
      if (ings.length > 0 && !match.includes('ingredients:')) {
          const ingsStr = `ingredients: ${JSON.stringify(ings)},`;
          return `${match}\n    ${ingsStr}`;
      }
      return match;
  });
  fs.writeFileSync(filePath, content);
  console.log(`Updated FOODS_FIXED in ${filePath}`);
};

updateFile(path.join(__dirname, 'src/seed/controlled.seed.ts'));
updateFile(path.join(__dirname, 'src/seed/controlled.seed.reset.ts'));
