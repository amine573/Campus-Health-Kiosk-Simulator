require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGODB_URI = process.env.MONGODB_URI;

mongoose.connect(MONGODB_URI).then(async () => {
  console.log('✅ Connected');

  const hashed_stu = await bcrypt.hash('Student@12345', 12);
  const hashed_adm = await bcrypt.hash('Admin@12345', 12);

  await mongoose.connection.collection('users').updateOne(
    { campusId: 'STU001' },
    { $set: { password: hashed_stu, ssoProvider: 'local', status: 'Active' } }
  );
  console.log('✅ STU001 password reset');

  await mongoose.connection.collection('users').updateOne(
    { campusId: 'ADMIN001' },
    { $set: { password: hashed_adm, ssoProvider: 'local', status: 'Active' } }
  );
  console.log('✅ ADMIN001 password reset');

  process.exit(0);
}).catch(e => {
  console.error(e.message);
  process.exit(1);
});
