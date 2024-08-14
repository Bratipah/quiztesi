# QuizTesi

QuizTesi powered by answer count of quizes in each question, it manages the questions with an array of quizes in one question. There after it calculates the count of the quizes and determines if the quizes have been answered by the user completely. This helps to determine if the question is fully submited or not and refilling of the same questions by the same user.

# Installation instructions
([]https://docs.cartesi.io/cartesi-rollups/1.3/development/installation/)

# Compiling Instructions
1. Clone the repository
2. Run cd quiztesi
3. Run cartesi build
4. Run cartesi run
5. Run cartesi send on a new terminal tab and send a generic input of the question and the quizes to the application using foundry following the necessary steps.
6. visit the graphql endpoint ([]http://localhost:8080/graphql) on the browser.
```
query notices {
  notices {
    edges {
      node {
        index
        input {
          index
        }
        payload
      }
    }
  }
}
```
7. Inspect a request of the transactions count on the browser using this ([]http://localhost:8080/inspect)
