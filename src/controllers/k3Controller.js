import connection from "../config/connectDB.js";
import GameRepresentationIds from "../constants/game_representation_id.js";
import { generatePeriod } from "../helpers/games.js";

const K3Page = async (req, res) => {
  return res.render("bet/k3/k3.ejs");
};

const isNumber = (params) => {
  let pattern = /^[0-9]*\d$/;
  return pattern.test(params);
};

function formateT(params) {
  let result = params < 10 ? "0" + params : params;
  return result;
}

function timerJoin(params = "", addHours = 0) {
  let date = "";
  if (params) {
    date = new Date(Number(params));
  } else {
    date = new Date();
  }

  date.setHours(date.getHours() + addHours);

  let years = formateT(date.getFullYear());
  let months = formateT(date.getMonth() + 1);
  let days = formateT(date.getDate());

  let hours = date.getHours() % 12;
  hours = hours === 0 ? 12 : hours;
  let ampm = date.getHours() < 12 ? "AM" : "PM";

  let minutes = formateT(date.getMinutes());
  let seconds = formateT(date.getSeconds());

  return (
    years +
    "-" +
    months +
    "-" +
    days +
    " " +
    hours +
    ":" +
    minutes +
    ":" +
    seconds +
    " " +
    ampm
  );
}

const rosesPlus = async (auth, money) => {
  const [level] = await connection.query("SELECT * FROM level ");
  let level0 = level[0];

  const [user] = await connection.query(
    "SELECT `phone`, `code`, `invite` FROM users WHERE token = ? AND veri = 1  LIMIT 1 ",
    [auth],
  );
  let userInfo = user[0];

  const [f1] = await connection.query(
    "SELECT `phone`, `code`, `invite`, `rank` FROM users WHERE code = ? AND veri = 1  LIMIT 1 ",
    [userInfo.invite],
  );

  if (money >= 10000) {
    if (f1.length > 0) {
      let infoF1 = f1[0];
      let rosesF1 = (money / 100) * level0.f1;
      await connection.query(
        "UPDATE users SET money = money + ?, roses_f1 = roses_f1 + ?, roses_f = roses_f + ?, roses_today = roses_today + ? WHERE phone = ? ",
        [rosesF1, rosesF1, rosesF1, rosesF1, infoF1.phone],
      );
      const [f2] = await connection.query(
        "SELECT `phone`, `code`, `invite`, `rank` FROM users WHERE code = ? AND veri = 1  LIMIT 1 ",
        [infoF1.invite],
      );
      if (f2.length > 0) {
        let infoF2 = f2[0];
        let rosesF2 = (money / 100) * level0.f2;
        await connection.query(
          "UPDATE users SET money = money + ?, roses_f = roses_f + ?, roses_today = roses_today + ? WHERE phone = ? ",
          [rosesF2, rosesF2, rosesF2, infoF2.phone],
        );
        const [f3] = await connection.query(
          "SELECT `phone`, `code`, `invite`, `rank` FROM users WHERE code = ? AND veri = 1  LIMIT 1 ",
          [infoF2.invite],
        );
        if (f3.length > 0) {
          let infoF3 = f3[0];
          let rosesF3 = (money / 100) * level0.f3;
          await connection.query(
            "UPDATE users SET money = money + ?, roses_f = roses_f + ?, roses_today = roses_today + ? WHERE phone = ? ",
            [rosesF3, rosesF3, rosesF3, infoF3.phone],
          );
          const [f4] = await connection.query(
            "SELECT `phone`, `code`, `invite`, `rank` FROM users WHERE code = ? AND veri = 1  LIMIT 1 ",
            [infoF3.invite],
          );
          if (f4.length > 0) {
            let infoF4 = f4[0];
            let rosesF4 = (money / 100) * level0.f4;
            await connection.query(
              "UPDATE users SET money = money + ?, roses_f = roses_f + ?, roses_today = roses_today + ? WHERE phone = ? ",
              [rosesF4, rosesF4, rosesF4, infoF4.phone],
            );
          }
        }
      }
    }
  }
};

const validateBet = async (join, list_join, x, money, game) => {
  let checkJoin = isNumber(list_join);
  let checkX = isNumber(x);
  const checks = ["a", "b", "c", "d", "e", "total"].includes(join);
  const checkGame = ["1", "3", "5", "10"].includes(String(game));
  const checkMoney = ["1000", "10000", "100000", "1000000"].includes(money);

  if (
    !checks ||
    list_join.length > 10 ||
    !checkX ||
    !checkMoney ||
    !checkGame
  ) {
    return false;
  }

  if (checkJoin) {
    let arr = list_join.split("");
    let length = arr.length;
    for (let i = 0; i < length; i++) {
      const joinNum = [
        "0",
        "1",
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
      ].includes(arr[i]);
      if (!joinNum) {
        return false;
      }
    }
  } else {
    let arr = list_join.split("");
    let length = arr.length;
    for (let i = 0; i < length; i++) {
      const joinStr = ["c", "l", "b", "s"].includes(arr[i]);
      if (!joinStr) {
        return false;
      }
    }
  }

  return true;
};

const betK3 = async (req, res) => {
  try {
    let { listJoin, game, gameJoin, xvalue, money } = req.body;
    let auth = req.cookies.auth;

    // let validate = await validateBet(join, list_join, x, money, game);

    // if (!validate) {
    //     return res.status(200).json({
    //         message: 'Đặt cược không hợp lệ',
    //         status: false
    //     });
    // }

    const [k3Now] = await connection.query(
      `SELECT period FROM k3 WHERE status = 0 AND game = ${game} ORDER BY id DESC LIMIT 1 `,
    );
    const [user] = await connection.query(
      "SELECT `phone`, `code`, `invite`, `level`, `money` FROM users WHERE token = ? AND veri = 1  LIMIT 1 ",
      [auth],
    );
    if (k3Now.length < 1 || user.length < 1) {
      return res.status(200).json({
        message: "Error!",
        status: false,
      });
    }

    let userInfo = user[0];
    let period = k3Now[0];

    // // validate if user already have bet or big or small and betting again
    // const [makeBets] = await connection.query(
    //   `SELECT bet FROM result_k3 WHERE status = 0 AND phone = '${userInfo.phone}'`,
    // );
    // const betTypeList = makeBets.map((it) => it.bet);
    // if (betTypeList.length > 0 && !betTypeList.includes(listJoin)) {
    //   return res.status(200).json({
    //     message: `Error! You are not allowed to make different bet.`,
    //     status: false,
    //   });
    // }

    let date = new Date();
    let years = formateT(date.getFullYear());
    let months = formateT(date.getMonth() + 1);
    let days = formateT(date.getDate());
    let id_product =
      years + months + days + Math.floor(Math.random() * 1000000000000000);

    let total = 0;
    if (gameJoin == 1) {
      total = money * xvalue * String(listJoin).split(",").length;
    } else if (gameJoin == 2) {
      let twoSame = listJoin.split("@")[0]; // Chọn 2 số phù hợp
      let motDuyNhat = listJoin.split("@")[1]; // Chọn một cặp số duy nhất
      if (twoSame.length > 0) {
        twoSame = twoSame.split(",").length;
      }
      let lengthArr = 0;
      let count = 0;
      if (motDuyNhat.length > 0) {
        let arr = motDuyNhat.split("&");
        for (let i = 0; i < arr.length; i++) {
          motDuyNhat = arr[i].split("|");
          count = motDuyNhat[1].split(",").length;
        }
        lengthArr = arr.length;
        count = count;
      }
      total = money * xvalue * (lengthArr * count) + twoSame * money * xvalue;
    } else if (gameJoin == 3) {
      let baDuyNhat = listJoin.split("@")[0]; // Chọn 3 số duy nhất
      let countBaDuyNhat = 0;
      if (baDuyNhat.length > 0) {
        countBaDuyNhat = baDuyNhat.split(",").length;
      }
      let threeSame = listJoin.split("@")[1].length; // Chọn 3 số giống nhau
      total = money * xvalue * countBaDuyNhat + threeSame * money * xvalue;
    } else if (gameJoin == 4) {
      let threeNumberUnlike = listJoin.split("@")[0]; // Chọn 3 số duy nhất
      let twoLienTiep = listJoin.split("@")[1]; // Chọn 3 số liên tiếp
      let twoNumberUnlike = listJoin.split("@")[2]; // Chọn 3 số duy nhất

      let threeUn = 0;
      if (threeNumberUnlike.length > 0) {
        let arr = threeNumberUnlike.split(",").length;
        if (arr <= 4) {
          threeUn += xvalue * (money * arr);
        }
        if (arr == 5) {
          threeUn += xvalue * (money * arr) * 2;
        }
        if (arr == 6) {
          threeUn += xvalue * (money * 5) * 4;
        }
      }
      let twoUn = 0;
      if (twoNumberUnlike.length > 0) {
        let arr = twoNumberUnlike.split(",").length;
        if (arr <= 3) {
          twoUn += xvalue * (money * arr);
        }
        if (arr == 4) {
          twoUn += xvalue * (money * arr) * 1.5;
        }
        if (arr == 5) {
          twoUn += xvalue * (money * arr) * 2;
        }
        if (arr == 6) {
          twoUn += xvalue * (money * arr * 2.5);
        }
      }
      let UnlienTiep = 0;
      if (twoLienTiep == "u") {
        UnlienTiep += xvalue * money;
      }
      total = threeUn + twoUn + UnlienTiep;
    }
    let fee = total * 0.02;
    let price = total - fee;

    let typeGame = "";
    if (gameJoin == 1) typeGame = "total";
    if (gameJoin == 2) typeGame = "two-same";
    if (gameJoin == 3) typeGame = "three-same";
    if (gameJoin == 4) typeGame = "unlike";

    let check = userInfo.money - total;
    if (check >= 0) {
      let timeNow = Date.now();
      const sql = `INSERT INTO result_k3 SET id_product = ?,phone = ?,code = ?,invite = ?,stage = ?,level = ?,money = ?,price = ?,amount = ?,fee = ?,game = ?,join_bet = ?, typeGame = ?,bet = ?,status = ?,time = ?`;
      await connection.execute(sql, [
        id_product,
        userInfo.phone,
        userInfo.code,
        userInfo.invite,
        period.period,
        userInfo.level,
        total,
        price,
        xvalue,
        fee,
        game,
        gameJoin,
        typeGame,
        listJoin,
        0,
        timeNow,
      ]);
      await connection.execute(
        "UPDATE `users` SET `money` = `money` - ? WHERE `token` = ? ",
        [total, auth],
      );
      const [users] = await connection.query(
        "SELECT `money`, `level` FROM users WHERE token = ? AND veri = 1  LIMIT 1 ",
        [auth],
      );
      await rosesPlus(auth, total);
      const [level] = await connection.query("SELECT * FROM level ");
      let level0 = level[0];
      const sql2 = `INSERT INTO roses SET phone = ?,code = ?,invite = ?,f1 = ?,f2 = ?,f3 = ?,f4 = ?,time = ?`;
      let total_m = total;
      let f1 = (total_m / 100) * level0.f1;
      let f2 = (total_m / 100) * level0.f2;
      let f3 = (total_m / 100) * level0.f3;
      let f4 = (total_m / 100) * level0.f4;
      await connection.execute(sql2, [
        userInfo.phone,
        userInfo.code,
        userInfo.invite,
        f1,
        f2,
        f3,
        f4,
        timeNow,
      ]);
      return res.status(200).json({
        message: "Successful bet",
        status: true,
        // data: result,
        change: users[0].level,
        money: users[0].money,
      });
    } else {
      return res.status(200).json({
        message: "The amount is not enough",
        status: false,
      });
    }
  } catch (error) {
    console.log(error);
  }
};

// function makeGameResult(length) {
//   var result = "";
//   var characters = "123456";
//   var charactersLength = characters.length;
//   for (var i = 0; i < length; i++) {
//     result += characters.charAt(Math.floor(Math.random() * charactersLength));
//   }
//   return result;
// }

const addK3 = async (game) => {
  try {
    let join = "";
    if (game == 1) join = "k3d";
    if (game == 3) join = "k3d3";
    if (game == 5) join = "k3d5";
    if (game == 10) join = "k3d10";

    let [k3] = await connection.query(
      `SELECT period FROM k3 WHERE status = 0 AND game = ${game} ORDER BY id DESC LIMIT 1 `,
    );
    const isPendingGame = k3.length > 0;

    if (isPendingGame) {
      // let result2 = makeGameResult(3);
      let result2 = await generateGameResult(game);

      const [setting] = await connection.query("SELECT * FROM `admin_ac` ");
      let period = k3[0].period;

      let nextResult = "";
      if (game == 1) nextResult = setting[0].k3d;
      if (game == 3) nextResult = setting[0].k3d3;
      if (game == 5) nextResult = setting[0].k3d5;
      if (game == 10) nextResult = setting[0].k3d10;

      let newArr = "";

      if (nextResult == "-1") {
        // game algorithm generate result
        await connection.execute(
          `UPDATE k3 SET status = ? WHERE period = ? AND game = "${game}"`,
          [1, period],
        );
        newArr = "-1";
      } else {
        // admin set result
        let result = "";
        let arr = nextResult.split("|");
        let check = arr.length;
        if (check == 1) {
          newArr = "-1";
        } else {
          for (let i = 1; i < arr.length; i++) {
            newArr += arr[i] + "|";
          }
          newArr = newArr.slice(0, -1);
        }
        result = arr[0];
        await connection.execute(
          `UPDATE k3 SET result = ?,status = ? WHERE period = ? AND game = ${game}`,
          [result, 1, period],
        );
      }

      if (game == 1) join = "k3d";
      if (game == 3) join = "k3d3";
      if (game == 5) join = "k3d5";
      if (game == 10) join = "k3d10";

      await connection.execute(`UPDATE admin_ac SET ${join} = ?`, [newArr]);
    }

    let timeNow = Date.now();
    let gameRepresentationId = GameRepresentationIds.G5D[game];
    let NewGamePeriod = generatePeriod(gameRepresentationId);

    await connection.execute(`
         INSERT INTO k3
         SET period = ${NewGamePeriod}, result = 0, game = '${game}', status = 0, time = ${timeNow}
      `);
  } catch (error) {
    console.log(error);
    if (error) {
    }
  }
};

function getRandomElementExcluding(array, targets) {
  const filteredArray = array.filter((item) => !targets.includes(item));
  if (filteredArray.length === 0) {
    throw new Error("No valid elements to choose from.");
  }
  const randomIndex = Math.floor(Math.random() * filteredArray.length);
  return filteredArray[randomIndex];
}

function getRandomCharacter(char1, char2) {
  const random_value = Math.random()

  console.log("random_value", random_value)
  
  return random_value > 0.7 ? `${char1}` : `${char2}`;
}

function calculateBetTotals(data) {
  const result = {};

  data.forEach((item) => {
    const bet = item.bet;
    const money = item.money;

    // If the bet key already exists, add to its value; otherwise, initialize it
    if (result[bet]) {
      result[bet] += money;
    } else {
      result[bet] = money;
    }
  });

  return result;
}

// Function to win the small for each game
async function funHanding(game) {
  const [k3] = await connection.query(
    `SELECT * FROM k3 WHERE status = 1 AND game = ${game} ORDER BY id DESC LIMIT 2`,
  );

  let k3Info = k3[0];
  let totalResult, twoSameResult, threeSameResult, unlikeResult;

  /**
   * todo: need to put our logic for k3 games
   */

  // taking all the status === 0 records
  const [big_small_bet] = await connection.execute(
    `SELECT * FROM result_k3 WHERE status = ? AND game = ? AND join_bet = ? AND typeGame = ? AND bet IN (?, ?)`,
    [0, game, "1", "total", "b", "s"],
  );
  const [odd_even_bet] = await connection.execute(
    `SELECT * FROM result_k3 WHERE status = ? AND game = ? AND join_bet = ? AND typeGame = ? AND bet IN (?, ?)`,
    [0, game, "1", "total", "l", "c"],
  );
  const [number_bet] = await connection.execute(
    `SELECT * FROM result_k3 WHERE status = ? AND game = ? AND join_bet = ? AND bet IN (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      0,
      game,
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9",
      "10",
      "11",
      "12",
      "13",
      "14",
      "15",
      "16",
      "17",
      "18",
    ],
  );
  const betTypes = {
    bigSmall: ["b", "s"],
    oddEven: ["l", "c"],
    numbers: [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18],
  };

  const final_big_small_object = calculateBetTotals(big_small_bet);
  console.log("final_big_small_object-------", final_big_small_object);
  const final_odd_even_object = calculateBetTotals(odd_even_bet);
  console.log("final_odd_even_object-------", final_odd_even_object);

  const final_number_object = calculateBetTotals(number_bet);

  console.log("final_number_object,", final_number_object);

  let win_between_big_or_small;

  // -------------------------- for each join -------------------
  // for big small update

  const loose_bet_big_small =
    Object.keys(final_big_small_object)?.length === 1
      ? Object.keys(final_big_small_object)[0]
      : Number(final_big_small_object.b) > Number(final_big_small_object.s)
        ? "b"
        : "s";
 


  const filteredWinnerBigSmall = Object.keys(final_big_small_object)?.length !== 0 ? betTypes.bigSmall.filter(
    (it) => it != loose_bet_big_small,
  ) : [`${getRandomCharacter('b', 's')}`];
console.log("filteredWinnerBigSmall", filteredWinnerBigSmall)
  const winnerBigSmall = 
    filteredWinnerBigSmall[
      Math.floor(Math.random() * filteredWinnerBigSmall.length)
    ];
  console.log("loose_bet_big_small---------", loose_bet_big_small);
  await connection.execute(
    `UPDATE result_k3 SET status = 2 WHERE status = ? AND game = ? AND join_bet = ? AND typeGame = ? AND bet = ?`,
    [0, game, "1", "total", loose_bet_big_small],
  );

  // for odd even update
  const loose_bet_odd_even =
    Object.keys(final_odd_even_object)?.length === 1
      ? Object.keys(final_odd_even_object)[0]
      : Number(final_odd_even_object.c) > Number(final_odd_even_object.l)
        ? "c"
        : "l";
  console.log("loose_bet_odd_even---------", loose_bet_odd_even);
  console.log("final_odd_even_object", final_odd_even_object)

  let filteredWinnerOddEven =    Object.keys(final_odd_even_object)?.length !== 0 ?  betTypes.oddEven.filter(
    (it) => it != loose_bet_odd_even,
  ): [`${getRandomCharacter('c', 'l')}`];

  console.log("filteredWinnerOddEven", filteredWinnerOddEven)
  let winnerOddEven =
    filteredWinnerOddEven[
      Math.floor(Math.random() * filteredWinnerOddEven.length)
    ];

  await connection.execute(
    `UPDATE result_k3 SET status = 2 WHERE status = ? AND game = ? AND join_bet = ?  AND typeGame = ? AND bet = ?`,
    [0, game, "1", "total", loose_bet_odd_even],
  );

  /**
   * todo from sajal work for number part
   */
  // start number part from here

  let original_final_object = {};

  original_final_object = { ...final_number_object };
  for (let i = 0; i <= 9; i++) {
    const key = i.toString();
    if (!final_number_object.hasOwnProperty(key)) {
      final_number_object[key] = 0; // Initialize missing keys with 0
    }
  }

  // console.log("final_number_object",  final_number_object)
  // console.log("original_final_object", original_final_object)

  let check_zero_exist = false;
  let winNumber;

  let numbersWithEmptyBets = Object.keys(final_number_object).filter(
    (k) => final_number_object[k] === 0,
  );

  console.log({ numbersWithEmptyBets });
  if (numbersWithEmptyBets.length !== 0) {
    winNumber =
      numbersWithEmptyBets[
        Math.floor(Math.random() * numbersWithEmptyBets.length)
      ];
  } else {
    winNumber = Object.keys(final_number_object).reduce((lowest, key) =>
      final_number_object[key] < final_number_object[lowest] ? key : lowest,
    );
  }

  console.log({ winNumber });

  // for (const bet in final_number_object) {
  //   if (final_number_object[bet] === 0) {
  //     check_zero_exist = true;
  //     winNumber = bet;
  //   }

  // }

  // if (check_zero_exist) {

  let loseBetNumbers = betTypes.numbers.filter((it) => it != winNumber);
  // status = ? AND game = ? AND join_bet = ? AND typeGame = ?
  // winNumber = loseBetNumbers[Math.floor(Math.random() * loseBetNumbers.length)];
  await connection.execute(
    `UPDATE result_k3 
   SET status = 2 
   WHERE status = ? AND game = ? AND join_bet = ? AND typeGame = ? AND bet IN (${loseBetNumbers.map(() => "?").join(",")})`,
    ["0", game, "1", "total", ...loseBetNumbers.map((it) => it.toString())],
  );

  function getThreeNumbers(target) {
    let numbers = [1, 1, 1];

    let remaining = target - 3;

    while (remaining > 0) {
      let index = Math.floor(Math.random() * 3);
      if (numbers[index] < 6) {
        numbers[index]++;
        remaining--;
      }
    }

    return `${numbers[0]}${numbers[1]}${numbers[2]}`;
  }
console.log("winnerBigSmall", winnerBigSmall,winnerOddEven,  winNumber)
  const result = `${winnerBigSmall},${winnerOddEven},${getThreeNumbers(winNumber)}`;

  console.log({ result });

  // setting the result
  await connection.execute(
    `UPDATE result_k3 SET result = ? WHERE game = ? AND typeGame = ?`,
    [result, game, "total"],
  );

  await connection.execute(`UPDATE k3 SET result = ? WHERE id = ?`, [
    result,
    k3Info.id,
  ]);

  // } else {
  //   console.log("callll....");
  //   const lowestKey = Object.keys(final_number_object).reduce((lowest, key) =>
  //     final_number_object[key] < final_number_object[lowest] ? key : lowest,
  //   );

  //   console.log("Lowest key (winner):", lowestKey);

  //   try {
  //     // Iterate through all keys in the object
  //     for (const key of Object.keys(final_number_object)) {
  //       const status = key === lowestKey ? 1 : 2; // Set status to 1 for the lowest key, 2 for the rest

  //       const query = `
  //       UPDATE result_k3
  //       SET status = ?
  //       WHERE status = ? AND game = ? AND join_bet = ? AND bet = ? AND typeGame = ?
  //     `;

  //       const values = [status, 0, game, "1", "total", key];

  //       await connection.execute(query, values);
  //       console.log(`Key ${key} updated with status ${status}`);
  //     }
  //   } catch (error) {
  //     console.error("Error updating database:", error.message);
  //   }
  // }

  // let result = String(k3Info.result).split("");
  // let total = 0;
  // for (let i = 0; i < result.length; i++) {
  //   total += Number(result[i]);
  // }

  // function generateThreeDigitSum(sum) {
  //   const result = [];
  //   let remainingSum = sum;

  //   for (let i = 0; i < 3; i++) {
  //     const max = Math.min(6, remainingSum - (3 - i - 1));
  //     const digit = Math.floor(Math.random() * max) + 1;
  //     result.push(digit);
  //     remainingSum -= digit;
  //   }

  //   return result.join("");
  // }

  // // const betCategories = {
  // //   big: ["b"];
  // //   even: [""],
  // //   big_even: ["12", "14", "16", "18", "b", "c"],
  // //   big_odd: ["11", "13", "15", "17", "b", "l"],
  // //   small_even: ["4", "6", "8", "10", "s", "c"],
  // //   small_odd: ["3", "5", "7", "9", "s", "l"],
  // // };
  // const allKindOfBets = [
  //   3,
  //   4,
  //   5,
  //   6,
  //   7,
  //   8,
  //   9,
  //   10,
  //   11,
  //   12,
  //   13,
  //   14,
  //   15,
  //   16,
  //   17,
  //   18,
  //   "b", //big
  //   "s", //small
  //   "l", //Odd
  //   "c", //even
  // ];

  // let res1, res2, res3, res4;

  // // xử lý game Tổng số
  // const [betList] = await connection.execute(
  //   `SELECT SUM(money) as total, bet FROM result_k3 WHERE status = 0 AND game = ${game} AND typeGame = 'total' GROUP BY bet ORDER BY total ASC`,
  // );

  // const placedBetKinds = betList.map((item) => item.bet);

  // if (placedBetKinds.length > 0) {
  //   res1 = allKindOfBets[Math.floor(Math.random() * placedBetKinds.length)];
  // }
  // if (placedBetKinds.length === allKindOfBets.length) {
  //   res1 = placedBetKinds[0];
  // } else {
  //   res1 = getRandomElementExcluding(allKindOfBets, placedBetKinds);
  // }

  // // await connection.execute(
  // //   `UPDATE result_k3 SET status = 2, result = ? WHERE status = 0 AND game = ${game} AND typeGame = 'total' AND bet NOT IN ( ? ) `,
  // //   [res1, res1],
  // // );

  // // // xử lý game 2 số trùng nhau
  // const [twoSameBetList] = await connection.execute(
  //   `SELECT SUM(money) as total, bet FROM result_k3 WHERE status = 0 AND game = ${game} AND typeGame = 'two-same' GROUP BY bet ORDER BY total ASC`,
  // );

  // const placedTwoSameBetKinds = twoSameBetList.map((item) => item.bet);

  // if (placedTwoSameBetKinds.length > 0) {
  //   res2 =
  //     allKindOfBets[Math.floor(Math.random() * placedTwoSameBetKinds.length)];
  // }
  // if (placedTwoSameBetKinds.length === allKindOfBets.length) {
  //   res2 = placedBetKinds[0];
  // } else {
  //   res2 = getRandomElementExcluding(allKindOfBets, placedTwoSameBetKinds);
  // }

  // // await connection.execute(
  // //   `UPDATE result_k3 SET status = 2, result = ? WHERE status = 0 AND game = ${game} AND typeGame = 'two-same' AND bet NOT IN ( ? ) `,
  // //   [res2, res2],
  // // );

  // // // xử lý game 3 số trùng nhau
  // const [threeSameBetList] = await connection.execute(
  //   `SELECT SUM(money) as total, bet FROM result_k3 WHERE status = 0 AND game = ${game} AND typeGame = 'three-same' GROUP BY bet ORDER BY total ASC`,
  // );

  // const placedThreeSameBetKinds = threeSameBetList.map((item) => item.bet);

  // if (placedThreeSameBetKinds.length > 0) {
  //   res3 =
  //     allKindOfBets[Math.floor(Math.random() * placedThreeSameBetKinds.length)];
  // }
  // if (placedThreeSameBetKinds.length === allKindOfBets.length) {
  //   res3 = placedThreeSameBetKinds[0];
  // } else {
  //   res3 = getRandomElementExcluding(allKindOfBets, placedThreeSameBetKinds);
  // }

  // await connection.execute(
  //   `UPDATE result_k3 SET status = 2, result = ? WHERE status = 0 AND game = ${game} AND typeGame = 'three-same' AND bet NOT IN ( ? ) `,
  //   [res3, res3],
  // );
  // // // xử lý game 3 số khác nhau
  // const [unlikeBetList] = await connection.execute(
  //   `SELECT SUM(money) as total, bet FROM result_k3 WHERE status = 0 AND game = ${game} AND typeGame = 'unlike' GROUP BY bet ORDER BY total ASC`,
  // );

  // const placedUnlikeBetKinds = unlikeBetList.map((item) => item.bet);

  // if (placedUnlikeBetKinds.length > 0) {
  //   res4 =
  //     allKindOfBets[Math.floor(Math.random() * placedUnlikeBetKinds.length)];
  // }
  // if (placedUnlikeBetKinds.length === allKindOfBets.length) {
  //   res4 = placedUnlikeBetKinds[0];
  // } else {
  //   res4 = getRandomElementExcluding(allKindOfBets, placedUnlikeBetKinds);
  // }

  // await connection.execute(
  //   `UPDATE result_k3 SET status = 2, result = ? WHERE status = 0 AND game = ${game} AND typeGame = 'unlike' AND bet NOT IN ( ? ) `,
  //   [res4, res4],
  // );

  // //////

  // await connection.execute(
  //   `UPDATE result_k3 SET result = ? WHERE status = 0 AND game = ${game}`,
  //   [res1],
  // );

  // // update ket qua
  // await connection.execute(
  //   `UPDATE k3 SET result = ?, status = 1 WHERE id = ?`,
  //   [`${res1}${res2}${res3}`, k3Info.id],
  // );
}
async function plusMoney(game) {
  const [order] = await connection.execute(
    `SELECT id, phone, bet, price, money, fee, amount, result, typeGame FROM result_k3 WHERE status = 0 AND game = ${game} `,
  );

  for (let i = 0; i < order.length; i++) {
    let orders = order[i];
    let phone = orders.phone;
    let id = orders.id;
    let nhan_duoc = 0;
    let result = orders.result;
    if (orders.typeGame == "total") {
      let arr = orders.bet.split(",");
      let totalResult = orders.result.split("");
      let totalResult2 = 0;
      for (let i = 0; i < 3; i++) {
        totalResult2 += Number(totalResult[i]);
      }
      let total = orders.money / arr.length / orders.amount;
      let fee = total * 0.02;
      let price = total - fee;

      let lengWin = arr.filter(function (age) {
        return age == totalResult2;
      });

      let lengWin2 = arr.filter(function (age) {
        return !isNumber(age);
      });

      // if (totalResult2 % 2 == 0 && lengWin2.includes("c")) {
      //   nhan_duoc += price * 1.92;
      // }

      // if (totalResult2 % 2 != 0 && lengWin2.includes("l")) {
      //   nhan_duoc += price * 1.92;
      // }

      // if (totalResult2 >= 11 && totalResult2 <= 18 && lengWin2.includes("b")) {
      //   nhan_duoc += price * 1.92;
      // }

      // if (totalResult2 >= 3 && totalResult2 <= 11 && lengWin2.includes("s")) {
      //   nhan_duoc += price * 1.92;
      // }

      let get = 0;
      switch (lengWin[0]) {
        case "3":
          get = 207.36;
          break;
        case "3":
          get = 69.12;
          break;
        case "5":
          get = 34.56;
          break;
        case "6":
          get = 20.74;
          break;
        case "7":
          get = 13.83;
          break;
        case "8":
          get = 9.88;
          break;
        case "9":
          get = 8.3;
          break;
        case "10":
          get = 7.68;
          break;
        case "11":
          get = 7.68;
          break;
        case "12":
          get = 8.3;
          break;
        case "13":
          get = 9.88;
          break;
        case "14":
          get = 13.83;
          break;
        case "15":
          get = 20.74;
          break;
        case "16":
          get = 34.56;
          break;
        case "17":
          get = 69.12;
          break;
        case "18":
          get = 207.36;
          break;
      }

      if (isNumber(orders.bet)) {
        let fee = orders.money * 0.02;
        let price = orders.money - fee;
        nhan_duoc += orders.money * 9;
      } else {
        nhan_duoc += parseFloat(orders.price) * 2;
      }

      nhan_duoc += price * get;

      await connection.execute(
        "UPDATE `result_k3` SET `get` = ?, `status` = 1 WHERE `id` = ? ",
        [nhan_duoc, id],
      );

      const sql = "UPDATE `users` SET `money` = `money` + ? WHERE `phone` = ? ";
      await connection.execute(sql, [nhan_duoc, phone]);
    }
    nhan_duoc = 0;
    if (orders.typeGame == "two-same") {
      let kq = result.split("");
      let kq1 = kq[0] + kq[1];
      let kq2 = kq[1] + kq[2];
      let array = orders.bet.split("@");
      let arr1 = array[0].split(",");
      let arr2 = array[1];
      let arr3 = array[1].split("&");
      for (let i = 0; i < arr1.length; i++) {
        if (arr1[i] != "") {
          let check1 = arr1[i].includes(kq1);
          let check2 = arr1[i].includes(kq2);
          if (check1 || check2) {
            let lengthArr = 0;
            let count = 0;
            if (arr2.length > 0) {
              let arr = arr2.split("&");
              for (let i = 0; i < arr.length; i++) {
                arr2 = arr[i].split("|");
                count = arr2[1].split(",").length;
              }
              lengthArr = arr.length;
              count = count;
            }
            let total =
              orders.money / orders.amount / (lengthArr + arr1.length);
            nhan_duoc += total * 12.83;
          }
        }
      }
      arr2 = array[1];
      for (let i = 0; i < arr3.length; i++) {
        if (arr3[i] != "") {
          let files = arr3[i].split("|");
          let check1 = files[0].includes(kq1);
          let check2 = files[0].includes(kq2);
          if (check1 || check2) {
            let lengthArr = 0;
            let count = 0;
            if (arr2.length > 0) {
              let arr = arr2.split("&");
              for (let i = 0; i < arr.length; i++) {
                arr2 = arr[i].split("|");
                count = arr2[1].split(",").length;
              }
              lengthArr = arr.length;
              count = count;
            }
            let bale = 0;
            for (let i = 0; i < arr1.length; i++) {
              if (arr1[i] != "") {
                bale = arr1.length;
              }
            }
            let total = orders.money / orders.amount / (lengthArr + bale);
            nhan_duoc += total * 69.12;
          }
        }
      }
      nhan_duoc -= orders.fee;

      await connection.execute(
        "UPDATE `result_k3` SET `get` = ?, `status` = 1 WHERE `id` = ? ",
        [nhan_duoc, id],
      );
      const sql = "UPDATE `users` SET `money` = `money` + ? WHERE `phone` = ? ";
      await connection.execute(sql, [nhan_duoc, phone]);
    }

    nhan_duoc = 0;
    if (orders.typeGame == "three-same") {
      let kq = result;
      let array = orders.bet.split("@");
      let arr1 = array[0].split(",");
      let arr2 = array[1];

      for (let i = 0; i < arr1.length; i++) {
        if (arr1[i] != "") {
          let check1 = arr1[i].includes(kq);
          let bala = 0;
          if (arr2 != "") {
            bala = 1;
          }
          if (check1) {
            let total = orders.money / (arr1.length + bala) / orders.amount;
            nhan_duoc += total * 207.36 - orders.fee;
          }
        }
      }
      if (arr2 != "") {
        let bala = 0;
        for (let i = 0; i < arr1.length; i++) {
          if (arr1[i] != "") {
            bala = arr1.length;
          }
        }
        let total = orders.money / (1 + bala) / orders.amount;
        nhan_duoc += total * 34.56 - orders.fee;
      }
      await connection.execute(
        "UPDATE `result_k3` SET `get` = ?, `status` = 1 WHERE `id` = ? ",
        [nhan_duoc, id],
      );
      const sql = "UPDATE `users` SET `money` = `money` + ? WHERE `phone` = ? ";
      await connection.execute(sql, [nhan_duoc, phone]);
    }

    nhan_duoc = 0;
    if (orders.typeGame == "unlike") {
      let kq = result.split("");
      let array = orders.bet.split("@");
      let arr1 = array[0].split(",");
      let arr2 = array[1];
      let arr3 = array[2].split(",");

      for (let i = 0; i < arr1.length; i++) {
        if (arr1[i] != "") {
          let check1 = kq.includes(arr1[i]);
          let bala = 0;
          let bala2 = 0;
          for (let i = 0; i < arr3.length; i++) {
            if (arr3[i].length != "") {
              bala = arr3.length;
            }
          }
          if (arr2 == "u") {
            bala2 = 1;
          }
          if (!check1) {
            let total =
              orders.money / (arr1.length + bala + bala2) / orders.amount;
            nhan_duoc += total * 34.56 - orders.fee;
            if (arr2 == "u") {
              let total = orders.money / (1 + bala + bala2) / orders.amount;
              nhan_duoc += (total - orders.fee) * 8.64;
            }
          }
        }
      }
      if (arr2 == "u") {
        let bala = 0;
        let bala2 = 0;
        for (let i = 0; i < arr1.length; i++) {
          if (arr1[i] != "") {
            bala = arr1.length;
          }
        }
        for (let i = 0; i < arr3.length; i++) {
          if (arr3[i].length != "") {
            bala2 = arr3.length;
          }
        }
        let total = orders.money / (1 + bala + bala2) / orders.amount;
        nhan_duoc += (total - orders.fee) * 8.64;
      }
      for (let i = 0; i < arr3.length; i++) {
        if (arr1[i] != "") {
          let check1 = kq.includes(arr3[i]);
          let bala = 0;
          for (let i = 0; i < arr1.length; i++) {
            if (arr1[i].length != "") {
              bala = arr1.length;
            }
          }
          if (!check1) {
            let total = orders.money / (arr3.length + bala) / orders.amount;
            nhan_duoc += total * 6.91 - orders.fee;
          }
        }
      }
      await connection.execute(
        "UPDATE `result_k3` SET `get` = ?, `status` = 1 WHERE `id` = ? ",
        [nhan_duoc, id],
      );
      const sql = "UPDATE `users` SET `money` = `money` + ? WHERE `phone` = ? ";
      await connection.execute(sql, [nhan_duoc, phone]);
    }
  }
}

const handlingK3 = async (typeid) => {
  try {
    let game = Number(typeid);

    await funHanding(game);

    await plusMoney(game);
  } catch (err) {
    console.log(err);
  }
};

const listOrderOld = async (req, res) => {
  let { gameJoin, pageno, pageto } = req.body;
  let auth = req.cookies.auth;

  let checkGame = ["1", "3", "5", "10"].includes(String(gameJoin));
  if (!checkGame || pageno < 0 || pageto < 0) {
    return res.status(200).json({
      code: 0,
      msg: "Không còn dữ liệu",
      data: {
        gameslist: [],
      },
      status: false,
    });
  }
  const [user] = await connection.query(
    "SELECT `phone`, `code`, `invite`, `level`, `money` FROM users WHERE token = ? AND veri = 1  LIMIT 1 ",
    [auth],
  );

  let game = Number(gameJoin);

  const [k3] = await connection.query(
    `SELECT * FROM k3 WHERE status != 0 AND game = '${game}' ORDER BY id DESC LIMIT ${pageno}, ${pageto} `,
  );
  const [k3All] = await connection.query(
    `SELECT * FROM k3 WHERE status != 0 AND game = '${game}' `,
  );
  const [period] = await connection.query(
    `SELECT period FROM k3 WHERE status = 0 AND game = '${game}' ORDER BY id DESC LIMIT 1 `,
  );
  if (k3.length == 0) {
    return res.status(200).json({
      code: 0,
      msg: "No more data",
      data: {
        gameslist: [],
      },
      page: 1,
      status: false,
    });
  }
  if (!pageno || !pageto || !user[0] || !k3[0] || !period[0]) {
    return res.status(200).json({
      message: "Error!",
      status: false,
    });
  }
  let page = Math.ceil(k3All.length / 10);
  return res.status(200).json({
    code: 0,
    msg: "Get success",
    data: {
      gameslist: k3,
    },
    period: period[0].period,
    page: page,
    status: true,
  });
};

const GetMyEmerdList = async (req, res) => {
  let { gameJoin, pageno, pageto } = req.body;
  let auth = req.cookies.auth;

  let checkGame = ["1", "3", "5", "10"].includes(String(gameJoin));
  if (!checkGame || pageno < 0 || pageto < 0) {
    return res.status(200).json({
      code: 0,
      msg: "No more data",
      data: {
        gameslist: [],
      },
      status: false,
    });
  }

  let game = Number(gameJoin);

  const [user] = await connection.query(
    "SELECT `phone`, `code`, `invite`, `level`, `money` FROM users WHERE token = ? AND veri = 1 LIMIT 1 ",
    [auth],
  );
  const [result_5d] = await connection.query(
    `SELECT * FROM result_k3 WHERE phone = ? AND game = '${game}' ORDER BY id DESC LIMIT ${Number(pageno) + "," + Number(pageto)}`,
    [user[0].phone],
  );
  const [result_5dAll] = await connection.query(
    `SELECT * FROM result_k3 WHERE phone = ? AND game = '${game}' ORDER BY id DESC `,
    [user[0].phone],
  );

  if (!result_5d[0]) {
    return res.status(200).json({
      code: 0,
      msg: "No more data",
      data: {
        gameslist: [],
      },
      page: 1,
      status: false,
    });
  }
  if (!pageno || !pageto || !user[0] || !result_5d[0]) {
    return res.status(200).json({
      message: "Error!",
      status: true,
    });
  }
  let page = Math.ceil(result_5dAll.length / 10);

  let datas = result_5d.map((data) => {
    let { id, phone, code, invite, level, game, ...others } = data;
    return others;
  });

  return res.status(200).json({
    code: 0,
    msg: "Get success",
    data: {
      gameslist: datas,
    },
    page: page,
    status: true,
  });
};
async function generateGameResult(game) {
  try {
    // Fetch orders for the current game
    const [orders] = await connection.execute(
      `SELECT typeGame, bet, money, amount FROM result_k3 WHERE status = 0 AND game = ?`,
      [game],
    );

    // Define payout rules
    const payoutRules = {
      total: {
        3: 207.36,
        4: 69.12,
        5: 34.56,
        6: 20.74,
        7: 13.83,
        8: 9.88,
        9: 8.3,
        10: 7.68,
        11: 7.68,
        12: 8.3,
        13: 9.88,
        14: 13.83,
        15: 20.74,
        16: 34.56,
        17: 69.12,
        18: 207.36,
        c: 2,
        l: 2,
        b: 2,
        s: 2,
      },
      two: {
        twoSame: 12.83,
        twoD: 69.12,
      },
      three: {
        threeD: 207.36,
        threeSame: 34.56,
      },
      unlike: {
        unlikeThree: 34.56,
        threeL: 8.64,
        unlikeTwo: 6.91,
      },
    };

    // Call makeGameResult to calculate the result
    const result = await makeGameResult(3, orders, payoutRules);

    return result;
  } catch (error) {
    console.error("Error generating game result:", error);
    throw new Error("Failed to generate game result");
  }
}

// Updated makeGameResult to support async/await
async function makeGameResult(length, orders, payoutRules) {
  const characters = "123456";
  const possibleResults = [];

  // Generate all possible results
  for (let i = 0; i < characters.length; i++) {
    for (let j = 0; j < characters.length; j++) {
      for (let k = 0; k < characters.length; k++) {
        possibleResults.push(
          `${characters[i]}${characters[j]}${characters[k]}`,
        );
      }
    }
  }

  // Helper function to calculate payout for a specific result
  function calculatePayout(result, orders, payoutRules) {
    let totalPayout = 0;

    for (let order of orders) {
      let nhan_duoc = 0;
      const { typeGame, bet, money, amount } = order;
      const pricePerBet = money / amount;
      const fee = pricePerBet * 0.02;
      const price = pricePerBet - fee;

      if (typeGame === "total") {
        let arr = bet.split(",");
        let totalResult = result
          .split("")
          .reduce((sum, num) => sum + Number(num), 0);

        let matches = arr.filter((b) => b == totalResult);

        if (totalResult % 2 === 0 && arr.includes("c")) nhan_duoc += price * 2;
        if (totalResult % 2 !== 0 && arr.includes("l")) nhan_duoc += price * 2;
        if (totalResult >= 11 && totalResult <= 18 && arr.includes("b"))
          nhan_duoc += price * 2;
        if (totalResult >= 3 && totalResult <= 10 && arr.includes("s"))
          nhan_duoc += price * 2;

        if (matches.length > 0) {
          nhan_duoc += price * (payoutRules.total[matches[0]] || 0);
        }
      } else if (typeGame === "two-same") {
        let arr1 = bet.split("@")[0].split(",");
        let kq = result.split("");
        let kq1 = kq[0] + kq[1];
        let kq2 = kq[1] + kq[2];

        for (let b of arr1) {
          if (b.includes(kq1) || b.includes(kq2)) {
            nhan_duoc +=
              (money / amount / arr1.length) * payoutRules.two.twoSame;
          }
        }
      } else if (typeGame === "three-same") {
        let kq = result;
        let arr = bet.split("@")[0].split(",");

        for (let b of arr) {
          if (b.includes(kq)) {
            nhan_duoc +=
              (money / amount / arr.length) * payoutRules.three.threeD;
          }
        }
      } else if (typeGame === "unlike") {
        let arr1 = bet.split("@")[0].split(",");
        let arr2 = bet.split("@")[2]?.split(",") || [];
        let kq = result.split("");

        for (let b of arr1) {
          if (kq.includes(b)) {
            nhan_duoc +=
              (money / amount / arr1.length) * payoutRules.unlike.unlikeThree;
          }
        }

        for (let b of arr2) {
          if (kq.includes(b)) {
            nhan_duoc +=
              (money / amount / arr2.length) * payoutRules.unlike.unlikeTwo;
          }
        }
      }

      totalPayout += nhan_duoc;
    }

    return totalPayout;
  }

  // Evaluate all possible results to find the one with the minimum payout
  let zeroPayoutResults = [];
  let minPayoutResult = { result: "", payout: Infinity };

  for (let result of possibleResults) {
    const payout = calculatePayout(result, orders, payoutRules);

    if (payout === 0) {
      zeroPayoutResults.push(result);
    }

    if (payout < minPayoutResult.payout) {
      minPayoutResult = { result, payout };
    }
  }

  // Return a zero-payout result if possible, else return the minimum-payout result
  if (zeroPayoutResults.length > 0) {
    return zeroPayoutResults[
      Math.floor(Math.random() * zeroPayoutResults.length)
    ];
  }

  return minPayoutResult.result;
}

const k3Controller = {
  K3Page,
  betK3,
  addK3,
  handlingK3,
  listOrderOld,
  GetMyEmerdList,
};

export default k3Controller;
