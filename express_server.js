const express = require("express");
const app = express();
const cookieParser = require('cookie-parser');
const PORT = 8080; // default port 8080

app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

//ejs
app.set("view engine", "ejs");

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

function generateRandomString() {
  const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let randomString = '';
  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    randomString += characters.charAt(randomIndex);
  }
  return randomString;
} 

function getUserByEmail(email) {
  for (const userId in users) {
    const user = users[userId];
    if (user.email === email) {
      return user;
    }
  }
  return null;
}

//Handle POST req to create a new short URL
app.post('/urls', (req, res) => {
  const longURL = req.body.longURL;
  const generatedShortURL = generateRandomString();

  urlDatabase[generatedShortURL] = longURL;

  res.redirect(`/urls/${generatedShortURL}`);
});



//Endpoint for login form submission
app.post('/login', (req, res) => {
  const { username } = req.body;

  //userename cookie with value from form
  res.cookie('username', username);

  //redirect to /urls page
  res.redirect('/urls');
});

//Endpoint for logout form submission
app.post ('/logout', (req, res) => {
  res.clearCookie('username');
  res.redirect('/urls');
});

//Endpoint for registration form data
app.post ("/register", (req, res) => {
  const { email, password } = req.body;

  // Check if email or password are empty
  if (!email || !password) {
    return res.status(400).send("Email and password cannot be empty.");
  }

  // random user ID
  const userId = function generateRandomString() {
    const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let randomString = '';
    for (let i = 0; i < 6; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      randomString += characters.charAt(randomIndex);
    }
    return randomString;
  } 

  //new user object
  const newUser = {
    id: userId,
    email,
    password
  };

  //new user to users object
  users[userId] = newUser;

  //user_id cookie
  res.cookie("user_id", userId);

  // /urls page redirect
  res.redirect("/urls");

  //console.log(users);
});

app.get("/", (req, res) => {
  res.redirect("/urls");
});

app.get("/urls", (req, res) => {
  const user = users[req.cookies["user_id"]];
  const templateVars = { 
    user,
    // username: req.cookies["username"],
    urls: urlDatabase 
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const user = users[req.cookies["user_id"]];
  const templateVars = { 
    user
  };
  res.render("urls_new", templateVars);
});


app.get("/urls/:id", (req, res) => {
  const user = users[req.cookies["user_id"]];
  const templateVars = { 
    user, 
  id: req.params.id, 
  longURL: urlDatabase[req.params.id] 
};
  res.render("urls_show", templateVars);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b><body></html>\n");
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  if (longURL) {
    res.redirect(longURL);
  } else {
    res.status(404).send("Short URL not found");
  }
  });

app.get("/register", (req, res) => {
  res.render("registration");
});

const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2example.com",
    password: "dishwasher-funk"
  }
};



app.listen(PORT, () => {
  console.log(`Tinyapp listening on port ${PORT}!`);
});