const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  await mongoose.connection.collection('users').deleteOne({ campusId: 'STU001' });

  const password = await bcrypt.hash('Student@12345', 12);
  await mongoose.connection.collection('users').insertOne({
    campusId: 'STU001',
    email: 'student@aui.ma',
    name: 'Demo Student',
    password: password,
    role: 'Student',
    ssoProvider: 'local',
    status: 'Active',
    createdAt: new Date(),
    updatedAt: new Date(),
    lastLoginAt: null,
  });

  const check = await mongoose.connection.collection('users').findOne({ campusId: 'STU001' });
  console.log('✅ STU001 recreated');
  console.log('ssoProvider:', check.ssoProvider);
  console.log('password hash starts with $2:', check.password.startsWith('$2'));
  process.exit(0);
}).catch(e => { console.error(e.message); process.exit(1); });
