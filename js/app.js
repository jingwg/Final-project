// Group: Anirudh, Fikri, Jingwen, and Eric
// Prof: Joel Ross
// Course: Info 343
//Date: 7/20/2016

'use strict';

var myApp = angular.module('RecipeApp', ['ngSanitize', 'ui.router', 'ui.bootstrap', 'firebase']);

myApp.config(['$stateProvider', '$urlRouterProvider', function ($stateProvider, $urlRouterProvider) {

	$stateProvider
		//The home page
		.state('home', {
			url: '/',
			templateUrl: 'partials/home.html'
		})
		//The category page
		.state('category', {
			url: '/category',
			templateUrl: 'partials/category.html'
		})
		//The detail page 
		.state('detail', {
			url: '/detail/:id',
			templateUrl: 'partials/detail.html',
			controller: "detailsCtrl"
		})
		//The abstract list page
		.state('lists', {
			abstract: true,
			url: '/lists',
			templateUrl: 'partials/lists.html', //path of the partial to load
			controller: "ListCtrl"
		})
		//the lists page
		.state('lists.list', {
			url: '',
			templateUrl: 'partials/lists.list.html', //path of the partial to load
			controller: "ListCtrl"
		})
		//the list detail page 
		.state('listDetail', {
			url: '/lists/:list',
			templateUrl: 'partials/listDetail.html', //path of the partial to load
			controller: "ListDetailCtrl"
		})
		//the signIn Page
		.state('signIn', {
			url: '/signIn',
			templateUrl: 'partials/signIn.html',
			controller: 'signCtrl'
		})
		//the search Page
		.state('search', {
			url: '/search/:searchTerm',
			templateUrl: 'partials/search.html'
		})
		$urlRouterProvider.otherwise('/');

}]);



myApp.controller('FeatureCtrl', ['$scope', '$http', function ($scope, $http) {

	$http.get('http://api.yummly.com/v1/api/recipes?_app_id=727f9e61&_app_key=6432cf347203b199cad6e4ccd21ba822&q=').then(function (response) {
		$scope.message = "HELLO";
		var data = response.data.matches;
		$scope.topFour = _.sampleSize(data, 4);
		console.log($scope.topFour);
	});
}]);


// Gets list of recipe items and brings out relevant data from the json file to be displayed on the webpage
// changes the state of the webpage based on the search input recieved and then redirects via the id when the item is pressed
// to go to details page. Backbone for the landing page, category page, and searching page.
myApp.controller('recipiesSearch', ['$scope', '$http', '$location', '$stateParams', 'FirebaseService', function ($scope, $http, $location, $stateParams, FirebaseService) {
	// Changes state of url
	// and loads out the correct data for the search term in question from the external api.
	if($stateParams.searchTerm !== '') {
		$http.get('http://api.yummly.com/v1/api/recipes?_app_id=727f9e61&_app_key=6432cf347203b199cad6e4ccd21ba822&q=' +
				  $stateParams.searchTerm).then(function (response) {
			// Loads the data
			var data = response.data;
			//changes state parameter
			var searchObject = $stateParams.searchTerm;
			// Makes data usable in html and allows for two way binding
			$scope.items = data.matches;
		});
	};
	// Sends out the item that is clicked by tagging its ID
	$scope.sendDetails = function(id) {
		$scope.id = id;
		FirebaseService.storeID($scope.id);
	};
}]);

//Let user sign in to and customize their own meal plan
myApp.controller('signCtrl', ['$scope',"FirebaseService", function ($scope,FirebaseService) {
		$scope.newUser = {}; //for sign-in
		$scope.showSignOut = true;

		$scope.signUp = function() {
			var user = {"email":$scope.newUser.email, "password": $scope.newUser.password};
			FirebaseService.signUp(user);

		};
		$scope.signIn = function() {
			var user = {"email":$scope.newUser.email, "password": $scope.newUser.password,"lists": FirebaseService.lists};
			FirebaseService.signIn(user);

		};

		$scope.signOut = function() {
			FirebaseService.signOut();
			$scope.showSignOut = false;
		};

}])



//the controller for the modal display all the lists for user to choose
myApp.controller('ModalCtrl', ['$scope', '$uibModalInstance', function ($scope, $uibModalInstance) {
	//display the lists
	$scope.select = function (list) {
		$scope.searchList = list;
	}

	//close the modal
	$scope.cancel = function () {
		$uibModalInstance.dismiss('cancel');
	};

}]);

//the list controller, let user interact will all the lists
myApp.controller('ListCtrl', ["$scope", "FirebaseService" ,function ($scope, FirebaseService) {
	$scope.lists = FirebaseService.lists; // list is an array [list1, list2, list3], list1 = {name:favorite, content: [recipeA, recipeB, recipeC]}	
	//delete specific list
	$scope.deleteList = function (listName) {
		console.log(listName);
		FirebaseService.deleteList(listName);
		$scope.lists = FirebaseService.lists;
		alert("You successfuly deleted that!")
	}

	//create new plan
	$scope.addList = function (listName) {
		var newList = {};
		newList.name = $scope.listName;
		newList.content = [];
        FirebaseService.addList(newList);
	}

	//random create a new plan
	$scope.random = function(){
		FirebaseService.random();
	}

}])

//The controllerlet the listDetail page diplays all the recipe in the recipe list
myApp.controller('ListDetailCtrl', ["$scope", "$stateParams", "FirebaseService", "$filter", function ($scope, $stateParams, FirebaseService, $filter) {
	var lists = FirebaseService.lists;
	var targetList = [];
	for (var i = 0; i < lists.length; i++) {
		var tempList = lists[i];
		if (tempList.name == $stateParams.list) {
			targetList = lists[i];
		}
	}
	//console.log(targetList);
	$scope.recipes = targetList.items;
	
	console.log($scope.recipes);
	var rowCount = $('#threeColor').length;
	if (rowCount % 3 == 1) {
		$('#threeColor:last').css("background", "grey");  
	}
	else if (rowCount % 3 == 2) {
		$('#threeColor:nth-last-child(5)').css("background", "yellow");   
		$('#threeColor:nth-last-child(2)').css("background", "grey");   	 	 
		$('#threeColor:last').css("background", "grey");  
	}
}])

myApp.controller('detailsCtrl', ['$scope', '$http','FirebaseService', '$stateParams', function($scope, $http, FirebaseService, $stateParams){
	console.log(FirebaseService.isPreviouslyCalled());
	console.log($stateParams.id);
	var id;
	if(FirebaseService.isPreviouslyCalled() == false){
		id = FirebaseService.callID();
	} else{
		id = $stateParams.id;
	}
	console.log(id);
	var related;
	$http.get('http://api.yummly.com/v1/api/recipe/' + id + '?_app_id=727f9e61&_app_key=6432cf347203b199cad6e4ccd21ba822')
		.success(function (data) {
			$scope.detail = data;
		related = data.attributes.course[0];
		console.log(related);
		console.log(data);
		$http.get('http://api.yummly.com/v1/api/recipes?_app_id=727f9e61&_app_key=6432cf347203b199cad6e4ccd21ba822&q' + related).success(function(result){
			console.log(result);
			$scope.relateds = result.matches;
		})
	});
	
	$scope.lists = FirebaseService.lists;

	$scope.addToList = function (foodName, selectedListName) {
			var recipe = {"name": foodName};
			FirebaseService.addRecipe(recipe,selectedListName);
			console.log("Finish added");
			console.log(FirebaseService.lists);
	};

	$scope.showInput = function(){
		return true;
	};

	$scope.submit = function(newListName){
		console.log(newListName);
		var newList = {"name":newListName, "items":[]};
		FirebaseService.addList(newList);
		console.log(FirebaseService.lists);
		$scope.status = {
    		isopen: false
  		};

	};
}]);

//all interaction with firebase
myApp.factory('FirebaseService', ["$firebaseAuth", "$firebaseObject", "$firebaseArray","$http", function($firebaseAuth, $firebaseObject, $firebaseArray,$http){
	var service = {};
	var rootRef = firebase.database().ref();
	var usersRef = rootRef.child('users');
	service.userId = "";
	var currentUserRef;
	var currentUserObj;
	var listsRef;
	var listsObj;
	var Auth = $firebaseAuth();

	//id variable
	var storedID;
	var previouslyCalled = false;


	service.lists = [];
	service.randomCount = 1;
	//the default list
	var testOb = {name:"kale smothie"}
	var testList = { name: "favorite", items: [testOb] };
	service.lists.push(testList);

	//if the auth state changes, add the current user data to firebase
	Auth.$onAuthStateChanged(function(firebaseUser){
		if (firebaseUser) {
			console.log('logged in');
			service.userId = firebaseUser.uid;
			currentUserRef = usersRef.child(service.userId);
			currentUserObj = $firebaseObject(currentUserRef);

			//when the user log in refresh the page the data 
			currentUserObj.$loaded(function(data){
				if(data.lists !== undefined){
				service.lists = data.lists;
				}
			})
			
			listsRef = currentUserRef.child('lists');
			listsObj = $firebaseObject(listsRef);
		}
		else {
			console.log('logged out');
			service.userId = undefined;
		}
	});

	//get the current user
	service.getUser = function(){
		return currentUserObj;
	}

	//add new user to the firebase
	service.signUp = function(user){
		//service.currentUser = user;
		//create user
		Auth.$createUserWithEmailAndPassword(user.email, user.password)
			.then(function (firebaseUser) { //first time log in
				//display loginView
				service.userId = firebaseUser.uid; //save userID
				var userData = { 'email': user.email, 'password': user.password};
				currentUserRef = usersRef.child(firebaseUser.uid);
				currentUserRef.set(userData); //set the key's value to be the user just  created
				currentUserObj = $firebaseObject(currentUserRef);
				//service.currentUser = currentUserObj;
			})
			.catch(function (error) { //report any errors
				console.log(error);
			});

	};

	//every time the user sign in should display the data
	service.signIn = function(user){
		Auth.$signInWithEmailAndPassword(user.email, user.password);
		service.list = currentUserObj.lists;
		
	};

	//every time when log out save the data to firebase
	service.signOut = function(){
		console.log("sign out");
		service.update(service.lists);
		Auth.$signOut(); //AngularFire method
		service.currentUser = "";

	};

	//takes in new lists and update it to firebase
	service.update = function(lists){
		console.log("lists");
		console.log(currentUserObj);
		currentUserObj.lists = lists;
		console.log(currentUserObj);
		
		//bug: the use delete email and password
		currentUserObj.$save().then(function(){
			console.log("success save the lists");
		
		},function(){
			console.log('error');
		})
	};

	// create the random meal plan
	service.random = function(){
	// need to change the link later https://spoonacular-recipe-food-nutrition-v1.p.mashape.com/recipes/mealplans/generate?mashape-key=6BPjQnUGhCmsh3XpfwGoxWIB9Jsnp1uHxXFjsnYyFmnCQ7eA3f
	$http.get("https://spoonacular-recipe-food-nutrition-v1.p.mashape.com/recipes/mealplans/generate?mashape-key=6BPjQnUGhCmsh3XpfwGoxWIB9Jsnp1uHxXFjsnYyFmnCQ7eA3f"
	).then(function (response) {
			var data = response.data;
			data.name = "Random Meal Plan" + service.randomCount;
			var meals = data.items;
			for(var i = 0; i < meals.length; i++){
				//change the meal name
				var value = JSON.parse(meals[i].value);
				meals[i].name = value.title;
				
				//change the slot
				var slot = meals[i].slot;
				if(slot == 1){
					 meals[i].slot = "breakfast";
				}else if(slot == 2){
					meals[i].slot = "lunch";
				}else if(slot == 3){
					meals[i].slot = "dinner";
				}
				//remove day 
				if(i%3!=0){
					meals[i].day = "";
				}
				
				}
			service.lists.push(data);
			service.randomCount ++;
	})
	};

	//add recipe from the detail page to specific list
	//recipe = new recipe object
	//listName = ngModel the name
	service.addRecipe = function (recipe, ListName) {
		console.log("in the function");
		var listIndex = 0;
		for (var i = 0; i < service.lists.length; i++) {
			var tempList = service.lists[i];
			if (tempList.name == ListName) {
				listIndex = i;
				service.lists[i].items.push(recipe);
	
			}
		}
	};

	//add a new List into Lists
	service.addList = function (newlist) {
		service.lists.push(newlist);
		console.log(service.lists)
	};

	//delete the list from the lists
	service.deleteList = function (ListName) {
		var index = 0;
		for (var i = 0; i < service.lists.length; i++) {
			var tempList = service.lists[i];
			//find which list the user want to delete
			if (tempList.name == ListName) {
				index = 1;
			}
		}
		service.lists.splice(index, 1);
	};

	service.storeID = function(id){
		storedID = id;
		previouslyCalled = false;
		console.log(id);
		console.log(storedID);
		
	}

	service.callID = function(){
		console.log("called", storedID);
		previouslyCalled = true;
		return storedID;
	}

	service.isPreviouslyCalled = function(){
		return previouslyCalled;
	}

	return service;

}]);
