import { Product, ProductCategory, ProductStatus } from '../types';

export interface RealProduct {
  type: string;
  codeKD: string;
  codeKM: string;
  name: string;
  outputRatio: number | string;
  inputRatio: number | string;
  finishedProductCode: string;
  finishedProductRatio: number;
  inputUnit: string;
  outputUnit: string;
}

export const realProductsData: RealProduct[] = [
  // Bán thành phẩm - Trái cây
  {
    type: "Bán thành phẩm",
    codeKD: "TC0001",
    codeKM: "",
    name: "Bưởi (đếm trái, dĩa)",
    outputRatio: 0.5,
    inputRatio: 1,
    finishedProductCode: "",
    finishedProductRatio: 0,
    inputUnit: "trái",
    outputUnit: "trái"
  },
  {
    type: "Bán thành phẩm",
    codeKD: "TC0002",
    codeKM: "",
    name: "Cam (đếm trái, miếng)",
    outputRatio: 40,
    inputRatio: 8,
    finishedProductCode: "TC0008",
    finishedProductRatio: 8,
    inputUnit: "trái",
    outputUnit: "miếng"
  },
  {
    type: "Bán thành phẩm",
    codeKD: "TC0004",
    codeKM: "TC0009",
    name: "Dưa hấu (đếm trái, miếng) (4,9)",
    outputRatio: 48,
    inputRatio: 48,
    finishedProductCode: "TC0008",
    finishedProductRatio: 8,
    inputUnit: "trái",
    outputUnit: "miếng"
  },
  {
    type: "Bán thành phẩm",
    codeKD: "TC0013",
    codeKM: "",
    name: "Nho (đếm kg)",
    outputRatio: 400,
    inputRatio: 1000,
    finishedProductCode: "TC0008",
    finishedProductRatio: 100,
    inputUnit: "kg",
    outputUnit: "gram"
  },
  {
    type: "Bán thành phẩm",
    codeKD: "TC0005",
    codeKM: "",
    name: "Ổi (đếm trái, miếng)",
    outputRatio: 49,
    inputRatio: 6,
    finishedProductCode: "TC0008",
    finishedProductRatio: 8,
    inputUnit: "trái",
    outputUnit: "miếng"
  },
  {
    type: "Bán thành phẩm",
    codeKD: "TC0006",
    codeKM: "",
    name: "Táo (đếm trái, miếng)",
    outputRatio: 40,
    inputRatio: 8,
    finishedProductCode: "TC0008",
    finishedProductRatio: 8,
    inputUnit: "trái",
    outputUnit: "miếng"
  },
  {
    type: "Bán thành phẩm",
    codeKD: "TC0007",
    codeKM: "",
    name: "Xoài (đếm trái, miếng)",
    outputRatio: 48,
    inputRatio: 16,
    finishedProductCode: "TC0008",
    finishedProductRatio: 14,
    inputUnit: "trái",
    outputUnit: "miếng"
  },
  {
    type: "Bán thành phẩm",
    codeKD: "TA0007",
    codeKM: "",
    name: "Chả ram (đếm cây)",
    outputRatio: 250,
    inputRatio: 1000,
    finishedProductCode: "",
    finishedProductRatio: 0,
    inputUnit: "gram",
    outputUnit: "gram"
  },
  {
    type: "Bán thành phẩm",
    codeKD: "TA0003",
    codeKM: "",
    name: "Chả (đếm kg, dĩa)",
    outputRatio: 250,
    inputRatio: 1000,
    finishedProductCode: "",
    finishedProductRatio: 0,
    inputUnit: "gram",
    outputUnit: "gram"
  },
  {
    type: "Bán thành phẩm",
    codeKD: "TA0034",
    codeKM: "",
    name: "Bò gác bếp (đếm kg, miếng)",
    outputRatio: 1,
    inputRatio: 10,
    finishedProductCode: "",
    finishedProductRatio: 0,
    inputUnit: "kg",
    outputUnit: "miếng"
  },
  {
    type: "Bán thành phẩm",
    codeKD: "TA0002",
    codeKM: "",
    name: "Bò khô (đếm kg, miếng)",
    outputRatio: 1,
    inputRatio: 10,
    finishedProductCode: "",
    finishedProductRatio: 0,
    inputUnit: "kg",
    outputUnit: "miếng"
  },
  {
    type: "Bán thành phẩm",
    codeKD: "TA0001",
    codeKM: "",
    name: "Mực khô (Con)",
    outputRatio: 1,
    inputRatio: 1,
    finishedProductCode: "",
    finishedProductRatio: 0,
    inputUnit: "con",
    outputUnit: "con"
  },
  {
    type: "Bán thành phẩm",
    codeKD: "TA0004",
    codeKM: "",
    name: "Khoai tây (đếm gram)",
    outputRatio: 200,
    inputRatio: 1000,
    finishedProductCode: "",
    finishedProductRatio: 0,
    inputUnit: "gram",
    outputUnit: "gram"
  },
  {
    type: "Bán thành phẩm",
    codeKD: "TA0042",
    codeKM: "",
    name: "Phô mai xông khói",
    outputRatio: 200,
    inputRatio: 1000,
    finishedProductCode: "",
    finishedProductRatio: 0,
    inputUnit: "gram",
    outputUnit: "gram"
  },
  {
    type: "Bán thành phẩm",
    codeKD: "TA0032",
    codeKM: "",
    name: "Tré Bình Định",
    outputRatio: 1,
    inputRatio: 1,
    finishedProductCode: "",
    finishedProductRatio: 0,
    inputUnit: "",
    outputUnit: ""
  },
  {
    type: "Bán thành phẩm",
    codeKD: "TC0008",
    codeKM: "",
    name: "Đĩa trái cây (C,DH,N,O,T,X)",
    outputRatio: "8,8,100,8,8,14",
    inputRatio: 1,
    finishedProductCode: "",
    finishedProductRatio: 0,
    inputUnit: "",
    outputUnit: ""
  },
  {
    type: "Bán thành phẩm",
    codeKD: "TA0044",
    codeKM: "",
    name: "Nem chua ngọt",
    outputRatio: 200,
    inputRatio: 1000,
    finishedProductCode: "",
    finishedProductRatio: 0,
    inputUnit: "gram",
    outputUnit: "gram"
  },
  {
    type: "Bán thành phẩm",
    codeKD: "TA0045",
    codeKM: "",
    name: "Ba rọi xông khói",
    outputRatio: 250,
    inputRatio: 1000,
    finishedProductCode: "",
    finishedProductRatio: 0,
    inputUnit: "gram",
    outputUnit: "gram"
  },
  {
    type: "Bán thành phẩm",
    codeKD: "TA0046",
    codeKM: "",
    name: "Xúc xích heo xông khói vị tỏi",
    outputRatio: 250,
    inputRatio: 1000,
    finishedProductCode: "",
    finishedProductRatio: 0,
    inputUnit: "gram",
    outputUnit: "gram"
  },
  {
    type: "Bán thành phẩm",
    codeKD: "NVL-TA-0134",
    codeKM: "",
    name: "Chả gân chiên",
    outputRatio: 5,
    inputRatio: 1000,
    finishedProductCode: "TA0048",
    finishedProductRatio: 0,
    inputUnit: "gram",
    outputUnit: "miếng"
  },
  {
    type: "Bán thành phẩm",
    codeKD: "NVL-TA-0133",
    codeKM: "",
    name: "Chả sụn nướng",
    outputRatio: 5,
    inputRatio: 1000,
    finishedProductCode: "TA0048",
    finishedProductRatio: 0,
    inputUnit: "gram",
    outputUnit: "miếng"
  },
  {
    type: "Bán thành phẩm",
    codeKD: "NVL-TA-0132",
    codeKM: "",
    name: "Chả thịt nướng Lagi",
    outputRatio: 5,
    inputRatio: 1000,
    finishedProductCode: "TA0048",
    finishedProductRatio: 0,
    inputUnit: "gram",
    outputUnit: "miếng"
  },
  {
    type: "Bán thành phẩm",
    codeKD: "TC0012",
    codeKM: "",
    name: "Đông sương",
    outputRatio: 1,
    inputRatio: 1,
    finishedProductCode: "TC0012",
    finishedProductRatio: 1,
    inputUnit: "dĩa",
    outputUnit: "dĩa"
  },
  {
    type: "Bán thành phẩm",
    codeKD: "TA0048",
    codeKM: "",
    name: "Chả thập cẩm",
    outputRatio: "",
    inputRatio: "",
    finishedProductCode: "",
    finishedProductRatio: 0,
    inputUnit: "",
    outputUnit: ""
  },
  {
    type: "Bán thành phẩm",
    codeKD: "TA0052",
    codeKM: "",
    name: "Dồi sụn nướng",
    outputRatio: 250,
    inputRatio: 1000,
    finishedProductCode: "TA0052",
    finishedProductRatio: 0,
    inputUnit: "gram",
    outputUnit: "gram"
  },
  {
    type: "Bán thành phẩm",
    codeKD: "TA0055",
    codeKM: "",
    name: "Ba rọi 1 nắng nướng",
    outputRatio: 250,
    inputRatio: 1000,
    finishedProductCode: "TA0055",
    finishedProductRatio: 0,
    inputUnit: "gram",
    outputUnit: "gram"
  },
  {
    type: "Bán thành phẩm",
    codeKD: "TA0051",
    codeKM: "",
    name: "Chân gà ủ muối",
    outputRatio: 250,
    inputRatio: 1000,
    finishedProductCode: "TA0051",
    finishedProductRatio: 0,
    inputUnit: "gram",
    outputUnit: "gram"
  },
  {
    type: "Bán thành phẩm",
    codeKD: "TA0054",
    codeKM: "",
    name: "Chả ngũ sắc",
    outputRatio: 1,
    inputRatio: 1,
    finishedProductCode: "TA0054",
    finishedProductRatio: 1,
    inputUnit: "dĩa",
    outputUnit: "dĩa"
  },
  {
    type: "Bán thành phẩm",
    codeKD: "TA0053",
    codeKM: "",
    name: "Chả nướng lagi",
    outputRatio: 1,
    inputRatio: 1,
    finishedProductCode: "",
    finishedProductRatio: 0,
    inputUnit: "dĩa",
    outputUnit: "dĩa"
  },
  {
    type: "Bán thành phẩm",
    codeKD: "TA0057",
    codeKM: "",
    name: "Chả da ớt xiêm xanh",
    outputRatio: 1,
    inputRatio: 1,
    finishedProductCode: "",
    finishedProductRatio: 0,
    inputUnit: "dĩa",
    outputUnit: "dĩa"
  },
  {
    type: "Bán thành phẩm",
    codeKD: "TA0058",
    codeKM: "",
    name: "Nem sót gân huế",
    outputRatio: 1,
    inputRatio: 1,
    finishedProductCode: "",
    finishedProductRatio: 0,
    inputUnit: "dĩa",
    outputUnit: "dĩa"
  },
  {
    type: "Bán thành phẩm",
    codeKD: "TC0014",
    codeKM: "",
    name: "Dĩa mít",
    outputRatio: 1,
    inputRatio: 1,
    finishedProductCode: "",
    finishedProductRatio: 0,
    inputUnit: "dĩa",
    outputUnit: "dĩa"
  },
  {
    type: "Bán thành phẩm",
    codeKD: "TC0020",
    codeKM: "",
    name: "Trái Cây combo (C,DH,O,T,X)",
    outputRatio: "3,14,8,3,18",
    inputRatio: 1,
    finishedProductCode: "",
    finishedProductRatio: 0,
    inputUnit: "dĩa",
    outputUnit: "dĩa"
  },
  {
    type: "Bán thành phẩm",
    codeKD: "TA0079",
    codeKM: "",
    name: "Tôm Cuộn Khoai Tây",
    outputRatio: 1,
    inputRatio: 1,
    finishedProductCode: "",
    finishedProductRatio: 0,
    inputUnit: "cuộn",
    outputUnit: "cuộn"
  },
  {
    type: "Bán thành phẩm",
    codeKD: "TA0080",
    codeKM: "",
    name: "Viên hải sản",
    outputRatio: 250,
    inputRatio: 1000,
    finishedProductCode: "",
    finishedProductRatio: 0,
    inputUnit: "gram",
    outputUnit: "gram"
  },
  {
    type: "Bán thành phẩm",
    codeKD: "TA0056",
    codeKM: "",
    name: "Lườn Ngỗng Nga xông khói",
    outputRatio: 250,
    inputRatio: 1000,
    finishedProductCode: "",
    finishedProductRatio: 0,
    inputUnit: "gram",
    outputUnit: "gram"
  },
  {
    type: "Bán thành phẩm",
    codeKD: "TA0081",
    codeKM: "",
    name: "Gà vòng chiên giòn",
    outputRatio: 150,
    inputRatio: 1000,
    finishedProductCode: "",
    finishedProductRatio: 0,
    inputUnit: "gram",
    outputUnit: "gram"
  },

  // Thành phẩm - Bia
  {
    type: "Thành phẩm",
    codeKD: "BIA0002",
    codeKM: "",
    name: "Ken lon cao",
    outputRatio: 0,
    inputRatio: 0,
    finishedProductCode: "",
    finishedProductRatio: 0,
    inputUnit: "Lon",
    outputUnit: "Lon"
  },
  {
    type: "Thành phẩm",
    codeKD: "BIA0017",
    codeKM: "",
    name: "SG Trắng lon",
    outputRatio: 0,
    inputRatio: 0,
    finishedProductCode: "",
    finishedProductRatio: 0,
    inputUnit: "Lon",
    outputUnit: "Lon"
  },
  {
    type: "Thành phẩm",
    codeKD: "BIA0004",
    codeKM: "",
    name: "Tiger bạc",
    outputRatio: 0,
    inputRatio: 0,
    finishedProductCode: "",
    finishedProductRatio: 0,
    inputUnit: "Lon",
    outputUnit: "Lon"
  },
  {
    type: "Thành phẩm",
    codeKD: "BIA0005",
    codeKM: "",
    name: "Tiger nâu  lon",
    outputRatio: 0,
    inputRatio: 0,
    finishedProductCode: "",
    finishedProductRatio: 0,
    inputUnit: "Lon",
    outputUnit: "Lon"
  },
  {
    type: "Thành phẩm",
    codeKD: "BIA0022",
    codeKM: "",
    name: "Heineken bạc lon 250ml",
    outputRatio: 0,
    inputRatio: 0,
    finishedProductCode: "",
    finishedProductRatio: 0,
    inputUnit: "Lon",
    outputUnit: "Lon"
  },

  // Thành phẩm - Đồ khô
  {
    type: "Thành phẩm",
    codeKD: "DK0006",
    codeKM: "",
    name: "Bánh Mix que",
    outputRatio: 0,
    inputRatio: 0,
    finishedProductCode: "",
    finishedProductRatio: 0,
    inputUnit: "Gói",
    outputUnit: "Gói"
  },
  {
    type: "Thành phẩm",
    codeKD: "DK0001",
    codeKM: "",
    name: "Bánh quế",
    outputRatio: 0,
    inputRatio: 0,
    finishedProductCode: "",
    finishedProductRatio: 0,
    inputUnit: "Gói",
    outputUnit: "Gói"
  },
  {
    type: "Thành phẩm",
    codeKD: "DK0003",
    codeKM: "",
    name: "Mít sấy",
    outputRatio: 0,
    inputRatio: 0,
    finishedProductCode: "",
    finishedProductRatio: 0,
    inputUnit: "Gói",
    outputUnit: "Gói"
  },
  {
    type: "Thành phẩm",
    codeKD: "DK0002",
    codeKM: "",
    name: "Mực Bento",
    outputRatio: 0,
    inputRatio: 0,
    finishedProductCode: "",
    finishedProductRatio: 0,
    inputUnit: "Gói",
    outputUnit: "Gói"
  },
  {
    type: "Thành phẩm",
    codeKD: "DK0005",
    codeKM: "",
    name: "Trái cây sấy",
    outputRatio: 0,
    inputRatio: 0,
    finishedProductCode: "",
    finishedProductRatio: 0,
    inputUnit: "Gói",
    outputUnit: "Gói"
  },
  {
    type: "Thành phẩm",
    codeKD: "DK0040",
    codeKM: "",
    name: "Kẹo ngậm Doublemint",
    outputRatio: 0,
    inputRatio: 0,
    finishedProductCode: "",
    finishedProductRatio: 0,
    inputUnit: "Hũ",
    outputUnit: "Hũ"
  },
  {
    type: "Thành phẩm",
    codeKD: "DK0027",
    codeKM: "",
    name: "Kẹo Xylitol",
    outputRatio: 0,
    inputRatio: 0,
    finishedProductCode: "",
    finishedProductRatio: 0,
    inputUnit: "Hộp",
    outputUnit: "Hộp"
  },
  {
    type: "Thành phẩm",
    codeKD: "DK0030",
    codeKM: "",
    name: "Phomai",
    outputRatio: 0,
    inputRatio: 0,
    finishedProductCode: "",
    finishedProductRatio: 0,
    inputUnit: "Hộp",
    outputUnit: "Hộp"
  },
  {
    type: "Thành phẩm",
    codeKD: "DK0004",
    codeKM: "",
    name: "Khoai tây slide nhỏ",
    outputRatio: 0,
    inputRatio: 0,
    finishedProductCode: "",
    finishedProductRatio: 0,
    inputUnit: "Hộp",
    outputUnit: "Hộp"
  },
  {
    type: "Thành phẩm",
    codeKD: "DK0038",
    codeKM: "",
    name: "Tỏi đen",
    outputRatio: 0,
    inputRatio: 0,
    finishedProductCode: "",
    finishedProductRatio: 0,
    inputUnit: "Hộp",
    outputUnit: "Hộp"
  },

  // Thành phẩm - Nước uống
  {
    type: "Thành phẩm",
    codeKD: "NN0001",
    codeKM: "",
    name: "Coca",
    outputRatio: 0,
    inputRatio: 0,
    finishedProductCode: "",
    finishedProductRatio: 0,
    inputUnit: "Lon",
    outputUnit: "Lon"
  },
  {
    type: "Thành phẩm",
    codeKD: "NN0002",
    codeKM: "",
    name: "Nước suối",
    outputRatio: 0,
    inputRatio: 0,
    finishedProductCode: "",
    finishedProductRatio: 0,
    inputUnit: "Chai",
    outputUnit: "Chai"
  },
  {
    type: "Thành phẩm",
    codeKD: "NN0005",
    codeKM: "",
    name: "Bò húc",
    outputRatio: 0,
    inputRatio: 0,
    finishedProductCode: "",
    finishedProductRatio: 0,
    inputUnit: "Lon",
    outputUnit: "Lon"
  },
  {
    type: "Thành phẩm",
    codeKD: "NN0003",
    codeKM: "",
    name: "Sting",
    outputRatio: 0,
    inputRatio: 0,
    finishedProductCode: "",
    finishedProductRatio: 0,
    inputUnit: "Lon",
    outputUnit: "Lon"
  },
  {
    type: "Thành phẩm",
    codeKD: "NN0004",
    codeKM: "",
    name: "Nước giải rượu",
    outputRatio: 0,
    inputRatio: 0,
    finishedProductCode: "",
    finishedProductRatio: 0,
    inputUnit: "Lon",
    outputUnit: "Lon"
  },
  {
    type: "Thành phẩm",
    codeKD: "NN0009",
    codeKM: "",
    name: "Nước yến Justenst",
    outputRatio: 0,
    inputRatio: 0,
    finishedProductCode: "",
    finishedProductRatio: 0,
    inputUnit: "Chai",
    outputUnit: "Chai"
  },

  // Thành phẩm - Thuốc lá
  {
    type: "Thành phẩm",
    codeKD: "TH0001",
    codeKM: "",
    name: "555 Việt Nam",
    outputRatio: 0,
    inputRatio: 0,
    finishedProductCode: "",
    finishedProductRatio: 0,
    inputUnit: "gói",
    outputUnit: "gói"
  },
  {
    type: "Thành phẩm",
    codeKD: "TH0002",
    codeKM: "",
    name: "Mèo",
    outputRatio: 0,
    inputRatio: 0,
    finishedProductCode: "",
    finishedProductRatio: 0,
    inputUnit: "gói",
    outputUnit: "gói"
  },
  {
    type: "Thành phẩm",
    codeKD: "TH0003",
    codeKM: "",
    name: "Ngựa",
    outputRatio: 0,
    inputRatio: 0,
    finishedProductCode: "",
    finishedProductRatio: 0,
    inputUnit: "gói",
    outputUnit: "gói"
  },
  {
    type: "Thành phẩm",
    codeKD: "TH0006",
    codeKM: "",
    name: "Mèo Demi",
    outputRatio: 0,
    inputRatio: 0,
    finishedProductCode: "",
    finishedProductRatio: 0,
    inputUnit: "gói",
    outputUnit: "gói"
  },
  {
    type: "Thành phẩm",
    codeKD: "TH0007",
    codeKM: "",
    name: "Sài Gòn",
    outputRatio: 0,
    inputRatio: 0,
    finishedProductCode: "",
    finishedProductRatio: 0,
    inputUnit: "gói",
    outputUnit: "gói"
  },

  // Thành phẩm - Khăn
  {
    type: "Thành phẩm",
    codeKD: "KH0001",
    codeKM: "",
    name: "Khăn lạnh",
    outputRatio: 0,
    inputRatio: 0,
    finishedProductCode: "",
    finishedProductRatio: 0,
    inputUnit: "cái",
    outputUnit: "cái"
  },
  {
    type: "Thành phẩm",
    codeKD: "KH0002",
    codeKM: "",
    name: "Khăn nóng",
    outputRatio: 0,
    inputRatio: 0,
    finishedProductCode: "",
    finishedProductRatio: 0,
    inputUnit: "cái",
    outputUnit: "cái"
  },

  // Thành phẩm - Rượu
  {
    type: "Thành phẩm",
    codeKD: "RUOU0033",
    codeKM: "",
    name: "Rượu Mơ Vàng 24k Nhật Bản",
    outputRatio: 0,
    inputRatio: 0,
    finishedProductCode: "",
    finishedProductRatio: 0,
    inputUnit: "Chai",
    outputUnit: "Chai"
  },

  // Thành phẩm - Quà tặng
  {
    type: "Thành phẩm",
    codeKD: "QT0002",
    codeKM: "",
    name: "Túi đựng mỹ phẩm Queen",
    outputRatio: 1,
    inputRatio: 1,
    finishedProductCode: "",
    finishedProductRatio: 0,
    inputUnit: "Cái",
    outputUnit: "Cái"
  },
  {
    type: "Thành phẩm",
    codeKD: "QT0001",
    codeKM: "",
    name: "Túi Đay Queen (Size M)",
    outputRatio: 1,
    inputRatio: 1,
    finishedProductCode: "",
    finishedProductRatio: 0,
    inputUnit: "Cái",
    outputUnit: "Cái"
  },
  {
    type: "Thành phẩm",
    codeKD: "QT0003",
    codeKM: "",
    name: "Băng Đô Queen",
    outputRatio: 1,
    inputRatio: 1,
    finishedProductCode: "",
    finishedProductRatio: 0,
    inputUnit: "Cái",
    outputUnit: "Cái"
  },
  {
    type: "Thành phẩm",
    codeKD: "QT0004",
    codeKM: "",
    name: "Gấu Bông Queen",
    outputRatio: 1,
    inputRatio: 1,
    finishedProductCode: "",
    finishedProductRatio: 0,
    inputUnit: "Con",
    outputUnit: "Con"
  },
  {
    type: "Thành phẩm",
    codeKD: "QT0005",
    codeKM: "",
    name: "Hộp Nến Thơm Queen (No.1)",
    outputRatio: 1,
    inputRatio: 1,
    finishedProductCode: "",
    finishedProductRatio: 0,
    inputUnit: "Hộp",
    outputUnit: "Hộp"
  },
  {
    type: "Thành phẩm",
    codeKD: "QT0006",
    codeKM: "",
    name: "Túi Trống Queen",
    outputRatio: 1,
    inputRatio: 1,
    finishedProductCode: "",
    finishedProductRatio: 0,
    inputUnit: "Cái",
    outputUnit: "Cái"
  },
  {
    type: "Thành phẩm",
    codeKD: "QT0007",
    codeKM: "",
    name: "Móc Khóa Âm Nhạc",
    outputRatio: 1,
    inputRatio: 1,
    finishedProductCode: "",
    finishedProductRatio: 0,
    inputUnit: "Cái",
    outputUnit: "Cái"
  }
];

// Helper function to convert real data to Product interface
export const convertToProductInterface = (realProduct: RealProduct) => {
  const businessCode = realProduct.codeKD || realProduct.codeKM;
  const inputUnit = realProduct.inputUnit || 'cái';
  const outputUnit = realProduct.outputUnit || 'cái';
  const inputQuantity = typeof realProduct.inputRatio === 'string' 
    ? (realProduct.inputRatio === '' ? 1 : parseFloat(realProduct.inputRatio) || 1)
    : (realProduct.inputRatio as number) || 1;
  const outputQuantity = typeof realProduct.outputRatio === 'string' 
    ? (realProduct.outputRatio === '' ? 1 : parseFloat(realProduct.outputRatio) || 1)
    : (realProduct.outputRatio as number) || 1;
  
  // Determine category based on type
  let category: ProductCategory = ProductCategory.OTHER;
  if (realProduct.type === 'Bán thành phẩm') {
    if (realProduct.name.toLowerCase().includes('trái') || 
        realProduct.name.toLowerCase().includes('cam') || 
        realProduct.name.toLowerCase().includes('bưởi') || 
        realProduct.name.toLowerCase().includes('dưa') || 
        realProduct.name.toLowerCase().includes('táo') || 
        realProduct.name.toLowerCase().includes('xoài') || 
        realProduct.name.toLowerCase().includes('nho')) {
      category = ProductCategory.FRUIT;
    } else if (realProduct.name.toLowerCase().includes('chả') || 
               realProduct.name.toLowerCase().includes('bò') || 
               realProduct.name.toLowerCase().includes('mực') || 
               realProduct.name.toLowerCase().includes('nem') || 
               realProduct.name.toLowerCase().includes('phô mai') || 
               realProduct.name.toLowerCase().includes('khoai')) {
      category = ProductCategory.PROCESSED;
    }
  } else if (realProduct.type === 'Thành phẩm') {
    if (realProduct.name.toLowerCase().includes('bia')) {
      category = ProductCategory.BEVERAGE;
    } else if (realProduct.name.toLowerCase().includes('coca') || 
               realProduct.name.toLowerCase().includes('nước') || 
               realProduct.name.toLowerCase().includes('sting') || 
               realProduct.name.toLowerCase().includes('bò húc')) {
      category = ProductCategory.BEVERAGE;
    } else if (realProduct.name.toLowerCase().includes('mèo') || 
               realProduct.name.toLowerCase().includes('ngựa') || 
               realProduct.name.toLowerCase().includes('555') || 
               realProduct.name.toLowerCase().includes('sài gòn')) {
      category = ProductCategory.TOBACCO;
    } else if (realProduct.name.toLowerCase().includes('khăn')) {
      category = ProductCategory.OTHER;
    } else if (realProduct.name.toLowerCase().includes('rượu')) {
      category = ProductCategory.BEVERAGE;
    } else if (realProduct.name.toLowerCase().includes('bánh') || 
               realProduct.name.toLowerCase().includes('kẹo') || 
               realProduct.name.toLowerCase().includes('mít') || 
               realProduct.name.toLowerCase().includes('tỏi')) {
      category = ProductCategory.DRY_GOODS;
    }
  }
  
  return {
    id: `real-${businessCode}`,
    businessCode,
    name: realProduct.name,
    category: category,
    inputUnit,
    outputUnit,
    inputQuantity,
    outputQuantity,
    isFinishedProduct: realProduct.type === 'Thành phẩm',
    status: ProductStatus.ACTIVE,
    businessStatus: 'active' as const,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'system',
    updatedBy: 'system'
  };
};
