const bcrypt = require('bcrypt');

async function hashPassword() {
  const password = '1012915Im@';
  const hashedPassword = await bcrypt.hash(password, 10);
  console.log('Hashed password:', hashedPassword);
  process.exit(0);
}

hashPassword();
