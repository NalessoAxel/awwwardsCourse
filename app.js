require("dotenv").config();


const logger = require("morgan");
const express = require("express");
const errorHandler = require("errorhandler");
const bodyParser = require("body-parser");
const methodOverride = require("method-override");
const find = require("lodash/find");
const app = express();
const path = require("path");
const port = 3000;

const Prismic = require("@prismicio/client");
const PrismicDOM = require("prismic-dom");

app.use(logger("dev"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(methodOverride());
app.use(errorHandler());
app.use(express.static(path.join(__dirname, "public")));

const initApi = (req) => {
  return Prismic.getApi(process.env.PRISMIC_ENDPOINT, {
    accessToken: process.env.PRISMIC_ACCES_TOKEN,
    req: req,
  });
};

const handleLinkResolver = (doc) => {
  console.log(doc);
  // Define the url depending on the document type
  // if (doc.type === 'page') {
  //   return '/page/' + doc.uid;
  // } else if (doc.type === 'blog_post') {s
  //   return '/blog/' + doc.uid;
  // }

  // Default to homepage
  return "/";
};

//middleware

app.use((req, res, next) => {
  // res.locals.ctx = {
  //   endpoint: process.env.PRISMIC_ENDPOINT,
  //   linkResolver: handleLinkResolver,
  // };

  res.locals.Link = handleLinkResolver;

  // add PrismicDOM in locals to access them in templates.
  res.locals.PrismicDOM = PrismicDOM;
  res.locals.Numbers = (index) => {
    return index == 0
      ? "One"
      : index == 1
      ? "Two"
      : index == 2
      ? "Three"
      : index == 3
      ? "Four"
      : "";
  };

  next();
});

app.set("views", path.join(__dirname, "views"));

app.set("view engine", "pug");

app.get("/", async (req, res) => {
  const api = await initApi(req);
  const meta = await api.getSingle("meta");
  const preloader = await api.getSingle("preloader");
  const home = await api.getSingle("home");

  const { results: collections } = await api.query(
    //deconstruct
    Prismic.Predicates.at("document.type", "collection"),
    {
      fetchLinks: "product.image",
    }
  );

  res.render("pages/home", {
    preloader,
    meta,
    home,
  });
});

app.get("/about", async (req, res) => {
  const api = await initApi(req);
  const about = await api.getSingle("about");
  const meta = await api.getSingle("meta");
  const preloader = await api.getSingle("preloader");

  res.render("pages/about", {
    about,
    meta,
    preloader,
  });
});

app.get("/collections", async (req, res) => {
  // console.log("REQUEST");
  const api = await initApi(req);
  const meta = await api.getSingle("meta");
  const home = await api.getSingle("home");
  const preloader = await api.getSingle("preloader");
  console.log("pre:", preloader);

  const { results: collections } = await api.query(
    //deconstruct
    Prismic.Predicates.at("document.type", "collection"),
    {
      fetchLinks: "product.image",
    }
  );

  // collections.forEach((collection) => {
  //   console.log(
  //     "results:",
  //     collection.data.products[0].product_product.data.image
  //   );
  // });

  res.render("pages/collections", {
    collections,
    home,
    meta,
    preloader,
  });
});

app.get("/detail/:uid", async (req, res) => {
  const api = await initApi(req);
  const meta = await api.getSingle("meta");
  const preloader = await api.getSingle("preloader");
  const product = await api.getByUID("product", req.params.uid, {
    fetchLinks: "collection.title",
  });

  // console.log(product.data);

  res.render("pages/detail", {
    meta,
    product,
    preloader,
  });
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
}); 