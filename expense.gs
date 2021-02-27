//-------------------------------- setup ----------------------------------
var token = "";
var telegramUrl = "https://api.telegram.org/bot" + token;
var webAppUrl = "https://script.google.com/macros/s/{WEB APP URL}/exec";

var userList = [872337781];

//-----------------------------words library-------------------------------
var savings = ["savings"];
var ASB = ["asb", "wahed"];
var car = ["car", "kereta"];
var parents = ["parents"];
var toll = ["toll"];
var gas = ["gas"];
var food = ["mcd", "subway"å]; 
//------------------------------------------------------------------------


function Categorize(item, price, expenseSheet){
  var text = item.toLowerCase();
  var spent = 0;
  
  if(food.includes(text)){
    spent = expenseSheet.getRange(1, 8).getValue();
    expenseSheet.getRange (1, 8).setValue(Number(spent) + Number(price));
    return "Food";
  }else if(ASB.includes(text)){
    spent = expenseSheet.getRange(2, 8).getValue();
    expenseSheet.getRange (2, 8).setValue(Number(spent) + Number(price));
    return "Investments";
  }else if(car.includes(text)){
    spent = expenseSheet.getRange(3, 8).getValue();
    expenseSheet.getRange (3, 8).setValue(Number(spent) + Number(price));
    return "Car";
  }else if(parents.includes(text)){
    spent = expenseSheet.getRange(4, 8).getValue();
    expenseSheet.getRange (4, 8).setValue(Number(spent) + Number(price));
    return "Parents";
  }else if(savings.includes(text)){
    spent = expenseSheet.getRange(5, 8).getValue();
    expenseSheet.getRange (5, 8).setValue(Number(spent) + Number(price));
    return "Savings";
  }else if(toll.includes(text)){
    spent = expenseSheet.getRange(6, 8).getValue();
    expenseSheet.getRange (6, 8).setValue(Number(spent) + Number(price));
    return "Toll";
  }else if(gas.includes(text)){
    spent = expenseSheet.getRange(7, 8).getValue();
    expenseSheet.getRange (7, 8).setValue(Number(spent) + Number(price));
    return "Gas";
  }else{
    spent = expenseSheet.getRange(8, 8).getValue();
    expenseSheet.getRange (8, 8).setValue(Number(spent) + Number(price));
    return "Others";
  }
}


//--------------------------------Webhook and sendMessage---------------------------
function setWebhook() {
   var url = telegramUrl + "/setWebhook?url=" + webAppUrl;
   var response = UrlFetchApp.fetch(url);
}
   
function sendMessage(id, text) {
  var url = telegramUrl + "/sendMessage?chat_id=" + id + "&text="+ text;
  var response = UrlFetchApp.fetch(url);
}
//---------------------------Message-----------------------------------------------
function doPost(e){
  var contents = JSON.parse(e.postData.contents);
  var id = contents.message.from.id;
  var text = contents.message.text;
  var first_name = contents.message.from.first_name;
  
  var ssId = "1xBjYp2SV3p6v_BX41rairZC9rxhhBfZ0qKHFjT9j9T4";
  var expenseSheet = SpreadsheetApp.openById(ssId).getSheetByName("2021");
 
  var item = text.split(" ");  
  var itemSize = item.length;
  
  if(!verify(id)){
    sendMessage(id, "Haaaaa apa tengok tengok!! %0AYou don't have the permission to use the bot!");
  }else{
    if(itemSize == 3){   // {-} {item} {cost}
      if(VerifyAddExpense(item)){
        AddExpenseToList(id, item, expenseSheet);
      }else{
        sendMessage(id, "Please use the correct format. %0AEnter /tolong to for more information.");
      }
      
    }else{
      Enquire(id, text, expenseSheet);
    }
  }
}

function verify(id){
  return userList.includes(id);
}

function VerifyAddExpense(item){
  if(item[0] != "-"){
    return false;
  }
  if(isNaN(parseFloat(item[2])) || item[2] < 0){
    return false;
  }
  return true;
}

//------------------------------Adding Expenses-------------------------------------
function AddExpenseToList(id, item, expenseSheet){
  var curDate = Utilities.formatDate(new Date(), "GMT+8", "dd/MM/yyyy");
  var cat = Categorize(item[1], item[2],expenseSheet);
//  expenseSheet.appendRow([curDate, cat, item[1], item[2]]);
  
  var lastRow = lastValue(expenseSheet, "A");
  expenseSheet.getRange(lastRow + 1, 1).setValue(curDate);
  expenseSheet.getRange(lastRow + 1, 2).setValue(cat);
  expenseSheet.getRange(lastRow + 1, 3).setValue(item[1]);
  expenseSheet.getRange(lastRow + 1, 4).setValue(item[2]);

  AddExpensesMinusBalance(expenseSheet);
  var balance = expenseSheet.getRange(3, 2).getValue();
  sendMessage(id, "You spent RM" + item[2] + " on "+ item[1] + "%0AYour remaining balance is RM" + balance);
}

function AddExpensesMinusBalance(expenseSheet){
  var range = expenseSheet.getDataRange();
  var lastRow = range.getLastRow();
  var values = expenseSheet.getRange(5, 4, lastRow-5+1, 1).getValues();
  var result = 0;
  for (var i = 0; i <values.length; i ++) {
    result += typeof values[i][0] == 'number' ? values[i][0] : 0;
  }
  
  expenseSheet.getRange(2, 2).setValue(result);
  expenseSheet.getRange(3, 2).setValue(expenseSheet.getRange (1, 2).getValue() - result);
  expenseSheet.getRange(9, 8).setValue(expenseSheet.getRange (1, 2).getValue() - result);
}

//--------------------------------Enquire----------------------------------------------
function Enquire(id, text, expenseSheet){
  switch(text){
      case "/start":
        sendMessage(id, "Hello there!");
        break;
      case "/alloc":
        var mesg = "";
        var range = expenseSheet.getRange(1, 6, 9, 3);
        var values = range.getValues();
        for(var i = 0; i < 9; i++){
          mesg += values[i][0] +": RM"+ values[i][2]  +"/ RM"+ values[i][1] +"%0A";
        }
        sendMessage(id, mesg);
        break;
      case "/balance":
        var balance = expenseSheet.getDataRange().getCell(3, 2).getValue();
        sendMessage(id, "Your balance is RM" + balance);
        break;
      case "/spent":
        var spent = expenseSheet.getDataRange().getCell(2, 2).getValue();
        sendMessage(id, "You've spent RM" + spent);
        break;
      case "/tolong":
        var res = "/allocation %2D%3E Your budget allocation %0A";
        res += "/balance %2D%3E Your current balance %0A";
        res += "/spent %2D%3E Your current spent %0A%0A";
        res += "To add an expense %0A";
        res += "%2D [Item] [Price] %0A";
        res += "/newmonth %2D%3E To start new month %0A%0A";
      
        sendMessage(id, res);
        break;
      case "/newmonth":
        var res = "Create new month succesful";
        sendMessage(id, res);
        StartNewMonth(expenseSheet);
        break;
      default:
        sendMessage(id, "Invalid command! %0AEnter /tolong to for more information.");
        break;
    }
}

//Start new month
function StartNewMonth(expenseSheet){
  var backupColumn = expenseSheet.getRange(5, 2).getValue();
  var lastRow = lastValue(expenseSheet, "A");
  
  var valuesToCopy = expenseSheet.getRange(7, 1, lastRow, 4).getValues();
  expenseSheet.getRange(1,backupColumn,valuesToCopy.length,4).setValues(valuesToCopy);
  expenseSheet.getRange(5, 2).setValue(backupColumn + 5);
  expenseSheet.getRange(8, 1, lastRow, 4).clear();
  
  //Reset alloc
  var budget = expenseSheet.getRange(1, 2).getValue();
  expenseSheet.getRange(9,8).setValue(budget);    //reset balance
  
  expenseSheet.getRange(1,8).setValue(0);      //reset alloc
  expenseSheet.getRange(2,8).setValue(0);
  expenseSheet.getRange(3,8).setValue(0);
  expenseSheet.getRange(4,8).setValue(0);
  expenseSheet.getRange(5,8).setValue(0);
  expenseSheet.getRange(6,8).setValue(0);
  expenseSheet.getRange(7,8).setValue(0);
  expenseSheet.getRange(8,8).setValue(0);


  expenseSheet.getRange(2,2).setValue(0);         //reset used
  expenseSheet.getRange(3,2).setValue(budget);    //reset balance
}

//General
function lastValue(expenseSheet, column) {
  var lastRow = expenseSheet.getMaxRows();
  var values = expenseSheet.getRange(column + "1:" + column + lastRow).getValues();

  for (; values[lastRow - 1] == "" && lastRow > 0; lastRow--) {}
  return lastRow;
}




















