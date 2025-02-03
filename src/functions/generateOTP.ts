// Method 1
const generateOTP1 = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Method 2
const generateOTP2 = (): string => {
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < 4; i++) {
    otp += digits[Math.floor(Math.random() * 10)];
  }
  return otp;
};

export default generateOTP1;
