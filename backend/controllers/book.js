const Book = require('../models/book')
const fs = require('fs')

exports.createBook = (req, res, next) => {
  console.log('Requête reçue:', req.body.book)

  const bookObject = JSON.parse(req.body.book)

  console.log('Objet livre après parsing:', bookObject)

  delete bookObject._id
  delete bookObject._userId
  console.log('Objet livre après suppression des propriétés:', bookObject)
  const book = new Book({
    ...bookObject,
    userId: req.auth.userId,
    imageUrl: `${req.protocol}://${req.get('host')}/images/${
      req.file.filename
    }`,
  })

  book
    .save()
    .then(() => {
      res.status(201).json({
        message: 'Livre enregistré !',
      })
    })
    .catch((error) => {
      res.status(400).json({
        error,
      })
    })
}

exports.getOneBook = (req, res, next) => {
  Book.findOne({ _id: req.params.id })
    .then((book) => res.status(200).json(book))
    .catch((error) => res.status(404).json({ error }))
}

exports.modifyBook = (req, res, next) => {
  const bookObject = req.file
    ? {
        userId: req.body.userId,
        title: req.body.title,
        author: req.body.author,
        imageUrl: `${req.protocol}://${req.get('host')}/images/${
          req.file.filename
        }`,
        year: req.body.year,
        genre: req.body.genre,
        ratings: [
          {
            userId: req.body.userId,
            grade: req.body.grade,
          },
        ],
        averageRating: req.body.averageRating,
      }
    : { ...req.body }

  delete bookObject._userId
  Book.findOne({ _id: req.params.id })
    .then((book) => {
      if (book.userId != req.auth.userId) {
        res.status(401).json({ message: 'Non autorisé' })
      } else {
        Book.updateOne(
          { _id: req.params.id },
          { ...req.body, _id: req.params.id }
        )
          .then(() => res.status(200).json({ message: 'Objet modifié !' }))
          .catch((error) => res.status(400).json({ error }))
      }
    })
    .catch((error) => {
      res.status(400).json({ error })
    })
}

exports.deleteBook = (req, res, next) => {
  Book.findOne({ _id: req.params.id })
    .then((book) => {
      if (book.userId != req.auth.userId) {
        res.status(401).json({ message: 'Non autorisé !' })
      } else {
        const filename = book.imageUrl.split('/images/')[1]
        fs.unlink(`images/${filename}`, () => {
          Book.deleteOne({ _id: req.params.id })
            .then(() => res.status(200).json({ message: 'objet supprimé !' }))
            .catch((error) => res.status(400).json({ error }))
        })
      }
    })
    .catch((error) => {
      res.status(500).json({ error })
    })
}

exports.getAllBook = (req, res, next) => {
  Book.find()
    .then((books) => res.status(200).json(books))
    .catch((error) => res.status(400).json({ error }))
}

exports.getBestBooks = (req, res, next) => {
  Book.find()
    .sort({ averageRating: -1 })
    .limit(3)
    .then((books) => res.status(200).json(books))
    .catch((error) => res.status(400).json({ error }))
}

exports.addRating = (req, res, next) => {
  const { userId, rating } = req.body

  if (rating < 0 || rating > 5) {
    return res
      .status(400)
      .json({ message: 'La note doit entre comprise entre 0 et 5.' })
  }
  Book.findOne({ _id: req.params.id })
    .then((book) => {
      if (!book) {
        return res.status(404).json({ message: 'Livre non trouvé.' })
      }

      const userHasRated = book.ratings.find((r) => r.userId === userId)
      if (userHasRated) {
        return res
          .status(400)
          .json({ message: 'Vous avez déjà noté ce livre.' })
      }

      book.ratings.push({ userId, grade: rating })

      const totalRatings = book.ratings.length
      const sumRatings = book.ratings.reduce((acc, curr) => acc + curr.grade, 0)
      book.averageRating = Math.round((sumRatings / totalRatings) * 10) / 10

      book
        .save()
        .then((updatedBook) => res.status(200).json(updatedBook))
        .catch((error) => res.status(400).json({ error }))
    })
    .catch((error) => res.status(500).json({ error }))
}
