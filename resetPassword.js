// resetPassword.js
const bcrypt = require('bcryptjs');
const sequelize = require('./db');
const User = require('./models/User');

(async () => {
  await sequelize.authenticate();
  const user = await User.findOne({ where: { username: 'floresa' } });
  if (!user) {
    console.error('Përdoruesi "floresa" nuk u gjet');
    process.exit(1);
  }
  user.password = await bcrypt.hash('webdeveloper', 10);
  await user.save();
  console.log('✅ Password i floresa u rikthye në "webdeveloper"');
  process.exit();
})();
