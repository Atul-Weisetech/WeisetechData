const app = require('./app'); // this must import the Express app
const PORT = 5000;
require('dotenv').config();


app.listen(PORT, () => {
  console.log(` Server running on port ${PORT}`);
});
                                                       