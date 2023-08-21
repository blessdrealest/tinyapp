const express = require("express");
const app = express();
const cookieParser = require('cookie-parser');
const PORT = 8080; // default port 8080
const bcrypt = require("bcryptjs");

const requireLogin = (req, res, next) => {
  if (!req.cookies.user_id) {

    const errorMessage = "You are not logged in. Please log in to shorten URLs";
    return res.status(403).send(`<p>${errorMessage}</p>`);
  }
  next();
};


app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

//ejs
app.set("view engine", "ejs");

const urlDatabase = {
  "b2xVn2": { longURL: "http://www.lighthouselabs.ca", userID: "userRandomID" },
  "9sm5xK": { longURL: "http://www.google.com", userID: "user2RandomID" }
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

function findUserWithEmail(email) {
  for (const userId in users) {
    const user = users[userId];
    if (user.email === email) {
      return user;
    }
  }
  return null;
}

function urlsForUser(id) {
  const userUrls = {};
  for (const shortURL in urlDatabase) {
    if (urlDatabase[shortURL].userID === id) {
      userUrls[shortURL] = urlDatabase[shortURL];
    }
  }
  return userUrls;
}

//Handle POST req to create a new short URL
app.post('/urls', (req, res) => {
  const longURL = req.body.longURL;
  const generatedShortURL = generateRandomString();
  const userId = req.cookies.user_id;

  urlDatabase[generatedShortURL] = { longURL, userID: userId };

  res.redirect(`/urls/${generatedShortURL}`);
});



//Endpoint for login form submission
app.post('/login', (req, res) => {
  const { email, password } = req.body;
  
//look up user by email
  const user = findUserWithEmail(email);

  //if user DNE or incorrect password
  if (!user || !bcrypt.compareSync(password, user.password)) {
    res.status(403).send("Invalid email or password");
    return;
  }

  //set user_id cookie with the user's ID
  res.cookie('user_id', user.id);

  //redirect to /urls 
  res.redirect('/urls');
});

//Endpoint for logout form submission
app.post ('/logout', (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/login');
});
// Delete URL endpoint
app.post("/urls/:id/delete", (req, res) => {
  const userId = req.cookies.user_id;
  const user = users[userId];

  if (!user) {
    const errorMessage = "You are not logged in. Please log in or register to delete this URL.";
    return res.status(401).send(`<p>${errorMessage}</p>`);
  }

  const url = urlDatabase[req.params.id];

  if (!url) {
    const errorMessage = "This short URL does not exist.";
    return res.status(404).send(`<p>${errorMessage}</p>`);
  }

  if (url.userID !== user.id) {
    const errorMessage = "You do not have permission to delete this URL.";
    return res.status(403).send(`<p>${errorMessage}</p>`);
  }

  delete urlDatabase[req.params.id];
  res.redirect("/urls");
});
//Endpoint for registration form data
app.post ("/register", (req, res) => {
  const { email, password } = req.body;

  // Check if email or password are empty
  if (!email || !password) {
    return res.status(400).send("Email and password cannot be empty.");
  }

  // Generate hashed password
  const hashedPassword = bcrypt.hashSync(password, 10);

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
    password: hashedPassword
  };

  //new user to users object
  users[userId] = newUser;

  //user_id cookie
  res.cookie("user_id", userId);

  // /urls page redirect
  res.redirect("/urls");
});

app.get("/", (req, res) => {
  res.redirect("/urls");
});

app.get("/urls", (req, res) => {
  const userId = req.cookies.user_id;
  const user = users[userId];

  if (!user) {
    const errorMessage = "You are not logged in. Please log in or register to view your URLs.";
    return res.status(401).send(`<p>${errorMessage}</p>`);
  }

  const userUrls = urlsForUser(userId);

  const templateVars = { 
    user,
    urls: userUrls 
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", requireLogin, (req, res) => {
  const user = users[req.cookies["user_id"]];
  const templateVars = { 
    user
  };
  res.render("urls_new", templateVars);
});


app.get("/urls/:id", (req, res) => {
  const userId = req.cookies.user_id;
  const user = users[userId];
  
  if (!user) {
    const errorMessage = "You are not logged in. Please log in or register to view this URL.";
    return res.status(401).send(`<p>${errorMessage}</p>`);
  }

  const url = urlDatabase[req.params.id];

  if (!url) {
    const errorMessage = "This short URL does not exist.";
    return res.status(404).send(`<p>${errorMessage}</p>`);
  }

  if (url.userID !== user.id) {
    const errorMessage = "You do not have permission to view this URL.";
    return res.status(403).send(`<p>${errorMessage}</p>`);
  }

  const templateVars = {
    user,
    id: req.params.id,
    longURL: url.longURL
  };
  res.render("urls_show", templateVars);
});

// Edit URL endpoint
app.get("/urls/:id/edit", (req, res) => {
  const userId = req.cookies.user_id;
  const user = users[userId];

  if (!user) {
    const errorMessage = "You are not logged in. Please log in or register to edit this URL.";
    return res.status(401).send(`<p>${errorMessage}</p>`);
  }

  const url = urlDatabase[req.params.id];

  if (!url) {
    const errorMessage = "This short URL does not exist.";
    return res.status(404).send(`<p>${errorMessage}</p>`);
  }

  if (url.userID !== userId) {
    const errorMessage = "You do not have permission to edit this URL.";
    return res.status(403).send(`<p>${errorMessage}</p>`);
  }

  const templateVars = {
    user,
    id: req.params.id,
    longURL: url.longURL
  };
  res.render("urls_edit", templateVars);
});


app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b><body></html>\n");
});

app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const url = urlDatabase[shortURL];
  
  if (url) {
    res.redirect(url.longURL);
  } else {
    res.status(404).send("Short URL not found");
  }
  });

app.get("/register", (req, res) => {
  const user = null;
  const templateVars= {
    user,
  };
  res.render("registration", templateVars);
});

app.get("/login", (req, res) => {
  const user = null;
  const templateVars= {
    user,
  };
  res.render("login", templateVars);
});

const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

app.listen(PORT, () => {
  console.log(`Tinyapp listening on port ${PORT}!`);
});