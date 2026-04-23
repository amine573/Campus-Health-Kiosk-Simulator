const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const hashed = await bcrypt.hash('Student@12345', 12);

  const result = await mongoose.connection.collection('users').findOneAndUpdate(
    { campusId: 'STU001' },
    {
      $set: {
        password: hashed,
        ssoProvider: 'local',
        status: 'Active',
        role: 'Student'
      }
    },
    { returnDocument: 'after' }
  );

  console.log('Updated user:');
  console.log('campusId:', result.campusId);
  console.log('ssoProvider:', result.ssoProvider);
  console.log('status:', result.status);
  console.log('password set:', result.password?.startsWith('$2'));
  process.exit(0);
}).catch(e => {
  console.error(e.message);
  process.exit(1);
});
