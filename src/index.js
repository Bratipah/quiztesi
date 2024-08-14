// XXX even though ethers is not used in the code below, it's very likely
// it will be used by any DApp, so we are already including it here
const { ethers } = require("ethers");

const rollup_server = process.env.ROLLUP_HTTP_SERVER_URL;
console.log("HTTP rollup_server url is " + rollup_server);

function hex2str(hex) {
  return ethers.toUtf8String(hex);
}

function str2hex(payload) {
  return ethers.hexlify(ethers.toUtf8Bytes(payload));
}

function isNumeric(num) {
  return !isNaN(num);
}


let users = []
let toUpperTotal = 0;
let quizzes = {};

quizzes["quiz1"] = {
  questions: [
    { question: "What is 2 + 2?", answer: "4"},
    { question: "What is capital city of Kenya?", answer: "Nairobi"},
  ],
  userAnswers: {},//store user answers
}



async function handle_advance(data) {
  console.log("Received advance request data " + JSON.stringify(data));

  const metadata = data["metadata"];
  const sender = metadata["msg_sender"];
  const payload = data["payload"];

  let input = hex2str(payload);
  if (isNumeric(input)) {
    const report_req = await fetch(rollup_server + "/report", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ payload: str2hex("Input is not in the expected format") }),
    });
    return "reject";
  }

  // Handle quiz responses
  if (input.startsWith("quiz:")) {
    const [quizName, questionIndex, userAnswer] = input.split(":").slice(1);
    if (quizzes[quizName]) {
      if (!quizzes[quizName].userAnswers[sender]) {
        quizzes[quizName].userAnswers[sender] = [];
      }
      quizzes[quizName].userAnswers[sender][questionIndex] = userAnswer;
      
      const correctAnswer = quizzes[quizName].questions[questionIndex].answer;
      const result = userAnswer === correctAnswer ? "Correct" : "Incorrect";

      const notice_req = await fetch(rollup_server + "/notice", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ payload: str2hex(result) }),
      });

      return "accept";
    } else {
      const report_req = await fetch(rollup_server + "/report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ payload: str2hex("Quiz not found") }),
      });
      return "reject";
    }
  }

  users.push(sender);
  toUpperTotal += 1;

  let sentence = input.toUpperCase();
  const notice_req = await fetch(rollup_server + "/notice", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ payload: str2hex(sentence) }),
  });

  return "accept";
}

async function handle_inspect(data) {
  console.log("Received inspect request data " + JSON.stringify(data));

  const payload = data["payload"];
  const route = hex2str(payload);

  let responseObject;
  if (route === "list") {
    responseObject = JSON.stringify({ users });
  } else if (route === "total") {
    responseObject = JSON.stringify({ toUpperTotal });
  } else if (route.startsWith("quiz:")) {
    const quizName = route.split(":")[1];
    if (quizzes[quizName]) {
      responseObject = JSON.stringify(quizzes[quizName].userAnswers);
    } else {
      responseObject = "Quiz not found";
    }
  } else {
    responseObject = "route not implemented";
  }

  const report_req = await fetch(rollup_server + "/report", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ payload: str2hex(responseObject) }),
  });

  return "accept";
}

var handlers = {
  advance_state: handle_advance,
  inspect_state: handle_inspect,
};

var finish = { status: "accept" };

(async () => {
  while (true) {
    const finish_req = await fetch(rollup_server + "/finish", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: "accept" }),
    });

    console.log("Received finish status " + finish_req.status);

    if (finish_req.status == 202) {
      console.log("No pending rollup request, trying again");
    } else {
      const rollup_req = await finish_req.json();
      var handler = handlers[rollup_req["request_type"]];
      finish["status"] = await handler(rollup_req["data"]);
    }
  }
})();
