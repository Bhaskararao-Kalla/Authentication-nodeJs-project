const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
const path = require("path");
const bcrypt = require("bcrypt");

const dbPath = path.join(__dirname, "userData.db");
let db = null;

module.exports = app;
app.use(express.json());

const initializationDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error : ${e.message}`);
    process.exit(1);
  }
};

initializationDBAndServer();

app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;

  if (password.length < 5) {
    response.status(400);
    response.send("Password is too short");
  } else {
    const hashedPassword = await bcrypt.hash(password, 10);
    const selectUserQuery = `
            SELECT * FROM user WHERE username = '${username}';
        `;

    const dbUser = await db.get(selectUserQuery);

    if (dbUser === undefined) {
      const createUserQuery = `
                INSERT INTO 
                    user(username , name , password , gender , location) 
                VALUES('${username}' ,
                        '${name}' ,
                        '${hashedPassword}' ,
                        '${gender}' ,
                        '${location}');
            `;

      await db.run(createUserQuery);
      response.send("User created successfully");
    } else {
      response.status(400);
      response.send("User already exists");
    }
  }
});

app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const selectUserQuery = `
        SELECT * FROM user 
        WHERE username = '${username}';
    `;

  const dbUser = await db.get(selectUserQuery);

  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isMatchedPassword = await bcrypt.compare(password, dbUser.password);

    if (isMatchedPassword === true) {
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;

  if (newPassword.length < 5) {
    response.status(400);
    response.send("Password is too short");
  } else {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const selectUserQuery = `
            SELECT * FROM user 
            WHERE username = '${username}';
        `;
    const dbUser = await db.get(selectUserQuery);
    const isPasswordSame = await bcrypt.compare(oldPassword, dbUser.password);

    if (isPasswordSame === true) {
      const updateQuery = `
                UPDATE user 
                SET password = '${hashedPassword}'
                WHERE username = '${username}';
            `;
      await db.run(updateQuery);
      response.send("Password updated");
    } else {
      response.status(400);
      response.send("Invalid current password");
    }
  }
});
