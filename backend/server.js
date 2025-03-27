// server.js
const express = require('express');
const fileUpload = require('express-fileupload');
const sql = require('mssql');
const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = 3000;
app.use(cors());

// ✅ Middleware for file uploads
app.use(fileUpload());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ✅ SQL Server Configuration
const dbConfig = {
  user: 'admin',
  password: 'PinRep!#45',
  server: 'database-1.cvw8qycoy1qz.ap-south-1.rds.amazonaws.com',
  port: 1433,
  database: 'TMT',
  options: {
    encrypt: true,
    trustServerCertificate: true,
  },
};

// ✅ Test DB Connection
async function testDBConnection() {
  try {
    await sql.connect(dbConfig);
    console.log('✅ Connected to Microsoft SQL Server successfully!');
  } catch (err) {
    console.error('❌ Database connection failed:', err);
    process.exit(1);
  }
}

// ✅ Upload Route
app.post('/upload', async (req, res) => {
  if (!req.files || !req.files.file) {
    return res.status(400).json({
      status: 'error',
      message: '❌ No file uploaded.',
    });
  }

  const uploadedFile = req.files.file;
  const tableName = req.body.tableName;
  const filePath = path.join(__dirname, 'uploads', uploadedFile.name);

  // Save the file temporarily
  uploadedFile.mv(filePath, async (err) => {
    if (err) {
      console.error('❌ Error saving file:', err);
      return res.status(500).json({
        status: 'error',
        message: '❌ Error saving file.',
        error: err.message,
      });
    }

    console.log(`✅ File received: ${uploadedFile.name}`);

    try {
      // ✅ Parse the Excel File
      const workbook = xlsx.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      console.log(`✅ Using Sheet: ${sheetName}`);

      const jsonData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
      console.log(`✅ Parsed Data: ${jsonData.length} rows`);

      if (jsonData.length === 0) {
        console.error('❌ No data found in the uploaded Excel file.');
        return res.status(400).json({
          status: 'error',
          message: '❌ No data found in the uploaded Excel file.',
        });
      }

      // ✅ Delete data if "Pending BPEM" is selected
      if (tableName === '[Outstanding BPEM]') {
        await deleteData('dbo.[Outstanding BPEM]');
        console.log('✅ Data deleted from [Outstanding BPEM] before upload.');
      }

      // ✅ Insert Data into SQL Server
      const sqlTableName =
        tableName === '[Resolved BPEM]'
          ? 'dbo.[Resolved BPEM]'
          : 'dbo.[Outstanding BPEM]';
      await insertDataToSQL(sqlTableName, jsonData);
      console.log("log after upload");
      
      // Send successful response after data insertion
      return res.status(200).json({
        status: 'success',
        message: `✅ Data uploaded successfully to ${tableName}.`,
      });
    } catch (err) {
      console.error('❌ Error processing file:', err);
      return res.status(500).json({
        status: 'error',
        message: '❌ Error processing file.',
        error: err.message,
      });
    } finally {
      // ✅ Delete the temp file
      fs.unlinkSync(filePath);
    }
  });
});

// ✅ Function to Delete Data (for Outstanding BPEM only)
async function deleteData(tableName) {
  try {
    const pool = await sql.connect(dbConfig);
    const deleteQuery = `DELETE FROM ${tableName}`;
    await pool.request().query(deleteQuery);
    console.log(`✅ Data deleted from table: ${tableName}`);
  } catch (err) {
    console.error('❌ Error deleting data:', err);
    throw err;  // Ensure to propagate error
  }
}

// ✅ Function to Insert Data into SQL Server
async function insertDataToSQL(tableName, data) {
  try {
    const pool = await sql.connect(dbConfig);

    for (let row of data) {
      // ✅ Extract columns and values
      const columns = Object.keys(row).map((col) => `[${col}]`).join(',');
      const values = Object.values(row)
        .map((value) => {
          if (typeof value === 'string') {
            return `'${value.replace(/'/g, "''")}'`; // Escape single quotes
          } else if (value === null || value === undefined) {
            return 'NULL';
          }
          return value;
        })
        .join(',');

      // ✅ SQL Insert Query
      const insertQuery = `INSERT INTO ${tableName} (${columns}) VALUES (${values})`;

      try {
        console.log(`Running query: ${insertQuery}`);
        await pool.request().query(insertQuery);
      } catch (err) {
        console.error('❌ Error inserting data:', err);
        throw err; // Stop the process and propagate error
      }
    }
    console.log(`✅ Data inserted successfully into table: ${tableName}`);
    return;
  } catch (err) {
    console.error('❌ Database connection error:', err);
    throw err;
  }
}

// ✅ Start Server and Test DB Connection
app.listen(PORT, async () => {
  console.log(`✅ Server running on port ${PORT}`);
  await testDBConnection();
});
