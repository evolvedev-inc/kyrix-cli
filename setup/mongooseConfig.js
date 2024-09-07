const fs = require('fs');
const path = require('path');

module.exports.setupMongoose = (targetPath, chalk) => {
  const mongoosePath = path.join(targetPath, 'src', 'utils');

  if (!fs.existsSync(mongoosePath)) {
    fs.mkdirSync(mongoosePath, { recursive: true });
  }

  fs.writeFileSync(path.join(mongoosePath, 'connect.db.ts'), `
    import mongoose from 'mongoose';

    const connectDB = async () => {
      try {
        const conn = await mongoose.connect(process.env.MONGO_URI || '', {
          useNewUrlParser: true,
          useUnifiedTopology: true
        });
        console.log('MongoDB connected:', conn.connection.host);
      } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
      }
    };

    export default connectDB;
  `);

  console.log(chalk.green('MongoDB+Mongoose setup completed.'));
};
