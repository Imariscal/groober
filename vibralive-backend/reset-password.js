require('dotenv').config({ path: '.env' });
const { AppDataSource } = require('./dist/database.js');

async function resetPassword() {
  try {
    const email = process.argv[2];
    const hashedPassword = process.argv[3];

    if (!email || !hashedPassword) {
      console.error('Uso: node reset-password.js <email> <hashedPassword>');
      process.exit(1);
    }

    const dataSource = new AppDataSource();
    if (!dataSource.isInitialized) {
      await dataSource.initialize();
    }

    const userRepository = dataSource.getRepository('User');
    const user = await userRepository.findOneBy({ email });

    if (!user) {
      console.error(`Usuario con email ${email} no encontrado`);
      process.exit(1);
    }

    user.hashedPassword = hashedPassword;
    await userRepository.save(user);

    console.log(`✓ Contraseña resetada exitosamente para ${email}`);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

resetPassword();
