var AegisBlog = angular.module("AegisBlog",["ngRoute","ngSanitize","aegisMedia","Aegis"]);


AegisBlog.config(function($routeProvider){
	$routeProvider.when('/Aegis/login', {
	templateUrl:'/views/login.html',
	controller:'AegisLoginController'
	})
	.when('/Aegis/setup',{
		templateUrl:'/views/setup.html',
		controller:'AegisPlatformController'
	})
	.when('/Aegis',{
		templateUrl:'/views/aegis.html',
		controller:'AegisPlatformController'
	})
	.when('/Aegis/new-post',{
		templateUrl:'/views/editorbeta.html',
		controller:'AegisPlatformController'
	})
	.when('/Aegis/edit-post/:postid',{
		templateUrl:'/views/editor.html',
		controller:'AegisPlatformController'
	})
	.when('/Aegis/posts',{
		templateUrl:'/views/posts.html',
		controller:'AegisPlatformController'
	})
	.when('/Aegis/new-post-beta',{
		templateUrl:'/views/editorbeta.html',
		controller:'AegisPlatformController'
	})
	.when('/',{
		templateUrl:'/views/currenttheme/blog.html',
		controller:'AegisPlatformController'
	})
	.when("/post/id=:postid",{
		templateUrl:'/views/currenttheme/post.html',
		controller:'AegisPlatformController'
	})
	.when("/404", {
		templateUrl:'/views/404.html',
		controller:'AegisPlatformController'
	})
	.when("/test-bed", {
		templateUrl:'/views/test.html',
		controller:'AegisPlatformController'
	})
	.otherwise({redirectTo:"/404"});
});

AegisBlog.service("loginState", function(){
	this.loggedIn = false;
	this.setState = function(newState){
		this.loggedIn = newState;
	}
	this.getState = function(){
		return this.loggedIn;
	}

});


AegisBlog.controller("AegisLoginController", function($scope, $location, $http, loginState){
	$scope.userlogin = function(){
		var theState = loginState;
		var loginPackage = {"usernameInput": $scope.usernameInput, "passwordHash": hex_sha512($scope.passwordInput)};
		$scope.passwordInput = "";
		$http.post("/loginuser", loginPackage).success(function(data){
			console.log(data);
			if(data){
				theState.setState(true);
			//console.log(theState.getState());
				$location.path("/Aegis");
			}
		});
	}

});

AegisBlog.controller("AegisPlatformSetupController", function($scope, $location, $http){
	$scope.preparePass = function(input){
		return hex_sha512(input);
	}
	$scope.buildSendPackage = function(){
		var temp = {};
		temp.username = $scope.username;
		temp.name = $scope.name;
		temp.blogname = $scope.blogname;
		temp.password =  $scope.preparePass($scope.password);
		return temp;
	};
	$scope.sumbitsetup = function(){

		var sendPackage = $scope.buildSendPackage();
		$http.post("/platform/setup", sendPackage).success(function(data){
			$location.path("/Aegis/login");
		});
	}
});



AegisBlog.controller("AegisPlatformController", function($scope, $location, $http, loginState, $window){
	$scope.theState = loginState;
	$scope.hasCookie = false;
	$http.get("/checkcookie").success(function(data){
		//console.log(data);
		if(data=true){
			$scope.hasCookie=true;
		}
	});
	$scope.gotToDashboard = function(){
		$location.path("/Aegis");
	}
	
	//console.log("the " + $scope.theState.getState() );
	$scope.checkForSetup = function(){
		//console.log("checking");
		if(!$scope.theState.getState()){
			$http.get("/platform/setup").success(function(response){
				//console.log(response);
				if(response){
					if($scope.hasCookie){
						$location.path("/Aegis");
					}else{
					//console.log("yes");
					$location.path("/Aegis/login");
					}
				}
				else{
					//console.log("what");
					$location.path("/Aegis/setup");
				}
			});
		}
		else if($scope.hasCookie){
			$location.path("/Aegis");
		}
		else{
			$location.path("/Aegis");
		}
	}


});

AegisBlog.controller("AegisPlatformEditorController", function($scope, $location, $http, $compile, $routeParams){
	$scope.editorTools = [];
	$scope.itemCount = 0;
	$scope.modes = [
	{"textMode": false},
	{"mediaMode": false}
	];
	$scope._id = "temp";
	$scope._img = "av8.jpg";

	$scope.textOptions = [
	{"mode":true, "name":"normal", "initial": ""},
	{"mode":false, "name":"Bold", "initial": "B"},
	{"mode":false, "name":"Italic", "initial": "I"},
	{"mode":false, "name":"Underline", "initial": "U"}
	];

	$scope.alignOptions = [
	{"mode":true, "name":"Left", "initial": "L"},
	{"mode":false, "name":"Center", "initial": "C"},
	{"mode":false, "name":"Right", "initial": "R"}
	]

	$scope.mediaTools = [
	{"imageMode": false},
	{"audioMode": false},
	{"videoMode": false}
	];

	$scope.newContent="";
	$scope.param = {};
	$scope.files = [];
	$scope.contentValues = [];
	$scope.currentElement = "";
	$scope.loadMenuItems = function(menu){
		$http.get("/platform/load/editor").success(function(data){
			$scope.editorTools = data;
		});
	}

	$scope.loadMenuItems($scope.editorTools);

	$scope.reloadTemplate = function(loadedData){
		var templateData = loadedData.template;
		for(var i = 0; i< templateData.length; i++){
			//console.log(templateData[i]);
			switch(templateData[i].obtype){
				case "text":
					var newBlock = angular.element($compile('<textarea  class="text-block"   id="itemBlock'+$scope.itemCount+'" ng-model="contentValues['+$scope.itemCount+'].val" resizer hover-eff></textarea>')($scope));
					angular.element(document.querySelector('edit-area')).append(newBlock);
					var myId = "#itemBlock"+$scope.itemCount;
					$scope.currentElement = myId;
					$scope.contentValues[$scope.itemCount]= {"obtype": templateData[i].obtype, "val": templateData[i].val, "align":templateData[i].align};
					$scope.itemCount++;
					break;
				case "image":
					var newBlock = angular.element($compile('<img class="postImageEdit" id="itemBlock'+$scope.itemCount+'" src="posts/'+loadedData._id+'/'+templateData[i].val+'"/>')($scope));
					angular.element(document.querySelector('edit-area')).append(newBlock);
					var myId = "#itemBlock"+$scope.itemCount;
					angular.element(document.querySelector(myId))[0].margin = "auto";
					$scope.contentValues[$scope.itemCount] = {"obtype":"image", "val": templateData[i].val};
					$scope.itemCount++;
					break;
			}
		}
	}
	angular.element(document.querySelector("title")).html("Aegis Platform - New Post");


	if($routeParams.postid){
		//console.log("time to edit");
		$http.get("/posts/"+$routeParams.postid).success(function(data){
			//console.log(data);
			$scope.title = data.title;
			angular.element(document.querySelector("title")).html("Aegis Platform - Editing: "+$scope.title);
			$scope.reloadTemplate(data);
		});
	}


	$scope.changeTextOptions = function(newOption){
		//console.log($scope.currentElement);
		switch(newOption){
			case "B":
				angular.element(document.querySelector("#"+$scope.currentElement)).css("font-weight", "bold");
				break;
			case "I":
				angular.element(document.querySelector("#"+$scope.currentElement)).css("font-style", "italic");
				break;
			case "U":
				angular.element(document.querySelector("#"+$scope.currentElement)).css("text-decoration", "underline");
				break;
		};
	}

	$scope.changeAlignOptions = function(newOption){
		var str = angular.element(document.querySelector("#"+$scope.currentElement))[0].id;
		var index = str.substring(9, str.length);
		console.log(index);
		switch(newOption){
			case "L":
				angular.element(document.querySelector("#"+$scope.currentElement)).css("text-align", "left");
				$scope.contentValues[index].align = "left";
				angular.element(document.querySelector("#"+$scope.currentElement))[0].focus();
				break;
			case "C":
				angular.element(document.querySelector("#"+$scope.currentElement)).css("text-align", "center");
				$scope.contentValues[index].align = "center";
				angular.element(document.querySelector("#"+$scope.currentElement))[0].focus();
				break;
			case "R":
				angular.element(document.querySelector("#"+$scope.currentElement)).css("text-align", "right");
				$scope.contentValues[index].align = "right";
				angular.element(document.querySelector("#"+$scope.currentElement))[0].focus();
				break;
		};
	}

	$scope.newTextBlock = function(){
		//adding new text block
		$scope.contentValues[$scope.itemCount] = {"obtype":"text", "val":"", "align": "left"};
		var newBlock = angular.element($compile('<textarea  class="text-block"   id="itemBlock'+$scope.itemCount+'" ng-model="contentValues['+$scope.itemCount+'].val" resizer hover-eff></textarea>')($scope));
		angular.element(document.querySelector('edit-area')).append(newBlock);
		var myId = "#itemBlock"+$scope.itemCount;
		//console.log(myId);
		angular.element(document.querySelector(myId))[0].focus();
		$scope.currentElement = myId;
		$scope.itemCount++;
		//focus on new text block
	}

	$scope.newMediaBlock = function(newFile){
		//console.log(newFile.length);
		if(newFile.length > 1){
			for(var i=0; i< newFile.length; i++){

				var t = newFile[i].type.split("/");
				console.log(t[0]);
				switch(t[0]){
					case "image":
						break;
				}
			}
		}
		else{
		$scope.contentValues[$scope.itemCount] = {"obtype":"image", "val": newFile[0].name};
		var newBlock = angular.element($compile('<img class="postImageEdit" id="itemBlock'+$scope.itemCount+'" src="posts/temp/'+newFile[0].name+'"/>')($scope));
		angular.element(document.querySelector('edit-area')).append(newBlock);
		var myId = "#itemBlock"+$scope.itemCount;
		angular.element(document.querySelector(myId))[0].margin = "auto";
		$scope.itemCount++;
		}

	}



	$scope.enableTextMode = function(){
		//console.log($scope.newContent);
		if( $scope.modes.textMode != true){
			$scope.newTextBlock();
			//console.log("in text mode");

		}
		$scope.modes.textMode=true;
		$scope.modes.mediaMode=false;
	}

	$scope.enableMediaMode = function(){
		if( $scope.modes.mediaMode != true){
		//	console.log("in media mode");
		//$scope.newMediaBlock();
		}

		$scope.modes.textMode=false;
		$scope.modes.mediaMode=true;
	}

	$scope.cancelPost = function(){
		if($routeParams.postid){
			$location.path("/Aegis");
		}
		else{
			$http.get("/cancelpost").success(function(data){
				$location.path("/Aegis");
			});
		}
	}
	$scope.savePost = function(){
		if($routeParams.postid){
			//console.log($scope.contentValues);
			//console.log($scope.title);
			var updatePackage = {"title":$scope.title, "template":$scope.contentValues, "pid": $routeParams.postid};
			console.log(updatePackage);
			$http.post("/updatepost", updatePackage).success(function(data){
				//console.log(data);
				$location.path("/Aegis");
			});
		}
		else{
			var savePackage={"title":"","body":"", "template": $scope.contentValues };
			//console.log($scope.contentValues);
			var contentPackage = {"title":$scope.title, "template" :$scope.contentValues}
			/*savePackage.title = $scope.title;
				for(var i=0; i< $scope.contentValues.length; i++){
					switch($scope.contentValues[i].obtype){
						case "text":
							savePackage.body = savePackage.body + "<div class='postText'>"+$scope.contentValues[i].val+"</div>";
							break;
						case "image":
							savePackage.body = savePackage.body + "<img imageresizer src='/posts/$eval(post._id)/"+$scope.contentValues[i].val+"'/>";
							break;
					}
				}
				console.log(savePackage);
			*/
			//console.log(contentPackage);
			$http.post("/savepost", contentPackage).success(function(data){
				//console.log(data);
				$location.path("/Aegis");
			});

			//console.log(angular.element(document.querySelector('edit-area')).html());
			//console.dir(angular.element(document.querySelector('edit-area')).html());
		}
	}



});


AegisBlog.controller("AegisPlatformPostsController", function($scope, $location, $http){
	//$scope._id = "";
	console.log($scope);
	angular.element(document.querySelector("title")).html("Aegis Platform - Posts");
	$scope.postlist = [];
	$scope.getPostlist = function(){
		$http.get("/getpostsb/all/0").success(function(data){
			//console.log(data)
			$scope.postlist = data;
		});
	}

	$scope.getPostlist();

	$scope.deletePost = function(){
		//var pID = {_id: this.post._id}
		//console.log(pID);
		$http.get("/delpostb/"+this.post._id).success(function(data){
			console.log(data);
		});
	}
	$scope.goDashboard = function(){
		$scope.$parent.gotToDashboard();	
	};
	
	$scope.editPost = function(){
		console.log(this.post._id);
		$location.path('/Aegis/edit-post/'+this.post._id);
	}

	$scope.changePublishedStatus = function(){
		var temp = this;
		$http.get("/postpublish/"+this.post._id).success(function(data){
			temp.post.published = !temp.post.published;
			if(temp.post.published){
				//console.log(this);
				//console.log($scope);
				//this.post.innerHTML = "Published";
			}
			else{
				//this.post.innerHTML = "Not Published";
			}
		});
	}

});
AegisBlog.directive("publishValue", function(){
	return{
		restrict:"A",
		require:"ngModel",
		link : function(scope, elem, attrs){
			if(scope.post.published){
				elem[0].innerHTML = "Published";
			}
			else{
				elem[0].innerHTML = "Not Published";
			}
		}
	}
});



AegisBlog.controller("AegisPlatformDashboardController", function($scope, $location, $http,$window){
	$scope.dashboardMenu = [];
	$scope.blogdata = {};
	$scope.latestposts = [];
	$scope.blogurl='http://localhost:8000';
	$scope.blogPaginationAvailable = [8,12,16,20];
	$scope.blogPaginationTypes=['Pages',"Scrolling"];
	angular.element(document.querySelector("title")).html("Aegis Platform");
	$scope.availableThemes = [];
	$scope.currentThemeSelected;
	$scope.themeList =[];

	$scope.tempit=function(){
		console.log($scope);
	}
	
	$scope.loadMenuItems = function(menu){
		$http.get("/platform/load/dashboard").success(function(data){
			$scope.dashboardMenu = data;
		});
	}
	$scope.loadThemes = function(){
		
	};
	/*
	$scope.loadThemes = function(themesObject){ // theme loading function from themes.json
		//console.log("loading themes");
		$http.get("/platform/load/themes").success(function(data){
			$scope.availableThemes = data;
			//console.log($scope.availableThemes);
			for(var i =0; i< $scope.availableThemes.length ;i++){
				$scope.themeList.push($scope.availableThemes[i].Name);
				//console.log($scope.availableThemes[i].Name);
				if($scope.availableThemes[i].Name == $scope.blogdata.themename){
					//console.log("same");
					$scope.currTheme = $scope.availableThemes[i];
				}

			}
			
			//$scope.currentThemeSelected = $scope.blogdata.themename;
			//console.log("loaded");
		});
	};
	*/
	$scope.loadBlogData = function(){
		$http.get("/blog").success(function(data){
			$scope.blogdata = data;
			//console.log(data);
			$scope.blogname = $scope.blogdata.blogname;
			$scope.paginationPerPage = $scope.blogPaginationAvailable[0];
			$scope.paginationType = $scope.blogPaginationTypes[0];
			//$scope.$$childHead.currentThemeSelected = $scope.blogdata.themename;
		});
		$http.get("/getpostsb/latest/5").success(function(data){
			$scope.latestposts = data;
		});
		//$scope.loadThemes();
	}

	

	

	$scope.loadMenuItems($scope.dashboardMenu);
	$scope.loadBlogData();
	
	$http.get("/platform/load/themes").success(function(data){
		//$scope.themeslist = data;
		//console.log(data);
		for(var i =0; i< data.length ;i++){
			//console.log(data[i]);
			$scope.themeList.push(data[i].Name);
		}
		console.log($scope.themeList)	
		$scope.$apply(function(){
			$scope.availableThemes = data;
		});
	});	
	
	/*$scope.navigateTo = function(){
		//console.log(this.dash.path);
		$location.path(this.dash.path);
	}
	*/
	$scope.navigateTo = function(opt){
		switch(opt){
			case "np":
				$location.path("/Aegis/new-post-beta");
				break;
			case "pl":
				$location.path("/Aegis/posts");
				break;
		}
	}

	
	$scope.changeTheme = function(){
		if($scope.currTheme.Name != $scope.blogdata.themename){
			var newTheme = {"pid":$scope.blogdata._id,"name": $scope.currTheme.Name}
			//console.log(newTheme);
			$http.post("/changeTheme", newTheme).success(function(data){});
		}
	}
	$scope.changeBlogName = function(){
		if($scope.blogname != $scope.blogdata.blogname){
			var newBlogName = {"pid":$scope.blogdata._id,"name": $scope.blogname}
			//console.log(newTheme);
			$http.post("/changeBlogName", newBlogName).success(function(data){});
		}
	}

	$scope.openBlog = function(){
		$window.open($scope.blogurl);
	};
	$scope.$watch("availableThemes", function(data){
		//console.log(data);
	});
});

AegisBlog.controller("AegisPlatformThemesController", function($scope, $http){
	$scope.tempThemes = [
	{"Name": "CleanOne", "directory":"/cleanone/", "version": "0.1"},
	{"Name": "Aegis", "directory":"/aegis/", "version": "0.1"}
];
	$scope.themenames=[]
	$scope.loadNames = function(){
		for(var i=0;i<$scope.tempThemes.length;i++){
			$scope.themenames.push($scope.tempThemes[i].Name);
		}
	}
	$scope.submitThemeData = function(data){
		var jsonData = JSON.parse(data);
		console.log(jsonData);
		$scope.tempThemes.push(jsonData);
	}
	$scope.$watch("tempThemes", function(data){
		//console.log(data);
		$scope.themenames.push(data.name);
		console.log("ahihfa");
	});
	$scope.loadNames()

});


AegisBlog.controller("AegisPlatformBlogController", function($scope, $http, $location,$compile,$routeParams,$window){
	var incrementValue = 8;
	
	$scope.blogdata = {};
	$scope.postlist = [];
	$scope.newposts = [];
	$scope.mIndex = incrementValue;
	$scope.skipTo = 0;
	$scope.currentPost = {};
	$scope.navControl = {prev:false,next:true,min:0,max:100};
	$scope.infScroll=true;
	
	$scope.getBlogData = function(){
		$http.get("/blog").success(function(data){
			$scope.blogdata = data;
			//console.log($scope.blogdata);
			var temp = angular.element($compile("<link rel='stylesheet' type='text/css' href='/themes/"+angular.lowercase($scope.blogdata.themename)+"/style.css'/>")($scope));
			angular.element(document.querySelector("head")).append(temp);
			angular.element(document.querySelector("title")).html($scope.blogdata.blogname);
		});
	};
	$scope.postCount = function(){
		$http.get("/getpostsb/count/0").success(function(data){
			//console.log(data);
			$scope.navControl.max = data;
		});
	}
	$scope.getPosts = function(){
		$http.get("/publishedposts").success(function(data){
			$scope.postlist = data;
			//console.log(data);
		});
		$http.get("/getpostsb/pages/"+$scope.skipTo+"-"+$scope.mIndex).success(function(data){
			//console.log(data);
			$scope.newposts = data;
			
		});
	}
	$scope.more = function(opt){
		//console.log(opt);
		if(opt=='--'){
			$scope.skipTo-=incrementValue;
			$scope.mIndex-=incrementValue;
			if($scope.skipTo-incrementValue<$scope.navControl.min){
				$scope.navControl.prev=false;
			}
			$scope.navControl.next=true;
		}else{
			$scope.skipTo+=incrementValue;
			$scope.mIndex+=incrementValue;
			if($scope.skipTo+ incrementValue >$scope.navControl.max){
				$scope.navControl.next=false;
			}
			$scope.navControl.prev=true;
		}
		console.log($scope.skipTo+ "-"+$scope.mIndex)
		$http.get("/getpostsb/pages/"+$scope.skipTo+"-"+$scope.mIndex).success(function(data){
			console.log(data.length);
			$scope.newposts = data;
			window.scrollTo(0, 0);
		});
	}
	$scope.morePosts = function(){
		$scope.skipTo+=incrementValue;
		$scope.mIndex+=incrementValue;
		if($scope.skipTo+ incrementValue >$scope.navControl.max){
			$scope.navControl.next=false;
		}
		$http.get("/getpostsb/pages/"+$scope.skipTo+"-"+$scope.mIndex).success(function(data){
			//console.log(data);
			//for(var i=0;i<data.length;i++){
				$scope.newposts.push.apply($scope.newposts,data);
			//}
			
			
		});	
	}
	$scope.formatDate = function(dateObj){
		return dateObj.slice(8,10)+"-"+dateObj.slice(5,7)+"-"+dateObj.slice(0,4)+"";
	}
	$scope.gotoHome = function(){
		$location.path("/");
		if($scope.skipTo!=0){
			$scope.mIndex = 5;
			$scope.skipTo = 0;
			$scope.navControl.prev=false;
			$scope.navControl.next=true;
			$scope.getPosts();
		}
	}
	$scope.gotoPost = function(postid){
		//console.log(postid);
		$location.path("/post/id="+postid);
	}


	$scope.getBlogData();
	if($routeParams.postid != null){
		$http.get("/getpostsb/"+$routeParams.postid+"/0").success(function(data){
			$scope.currentPost = data;
		});
	}

	else{
		$scope.getPosts();
		$scope.postCount();
	}
});




AegisBlog.directive("editArea", function(){
	return{
		restrict:"E",
		transclude: true,
		template:'<div  ng-transclude></div>',
		link: function(scope, elem, attrs){
			elem.bind('change', function(evChange){
				scope.$apply();
				scope.newContent = scope.newContent + evChange.target;
			});
		}
	}
});

AegisBlog.directive("resizer", function(){
	return{
		scope:{
		},
		link : function(scope, elem, attrs){
			//console.log(attrs);
			//scope.preHeight = attrs;
			elem.bind('keydown', function(evChange){
				//console.log(scope);
				elem.css("border-style", "none");
				if(scope.$parent.currentElement != elem[0].id){
					scope.$parent.currentElement = elem[0].id;
					//console.log("Changing current element to #"+elem[0].id);
				}
				scope.preHeight = attrs;
				var t = evChange.target;
				if(elem[0].clientHeight != t.scrollHeight || evChange.keyCode == 8){
					if(elem[0].clientHeight < t.scrollHeight){
					//console.log(elem[0].clientHeight + "   " + t.scrollHeight);
					elem.css("height", (t.scrollHeight) +"px");
					}
					else {
						elem.css("height", (t.scrollHeight -14) +"px");
						//console.log(elem[0].clientHeight + "   " + t.scrollHeight)
						//console.log(elem);
					}
					//console.log(t.scrollHeight);
				}
			});
		}
	}
})


AegisBlog.directive("imageresizer", function(){
	return{
		restrict:"A"
	}
});

AegisBlog.directive("titleInput", function(){
	return{
		restrict:"E",
		transclude: true,
		template: '<input placeholder="Title" class="titleInput" type="text" ng-model="title"/>',
		link: function(scope, elem, attrs){

		}
	}
});

AegisBlog.directive("textBlock", function(){
	return{
		restrict:"E",
		transclude: true,
		template: "<textarea placeholder='add stuff' ng-transclude></textarea>",

	}
});

AegisBlog.directive("hoverEff", function(){
	return{
		restrict:"A",
		link: function(scope, elem, attrs){
			elem.bind("mouseover", function(evChange){
				elem.css("border-style", "solid");
			});
			elem.bind("mouseout", function(evChange){
				elem.css("border-style", "none");
			});
		}
	}
});


AegisBlog.directive("setupcheck", function(){
	return{
		restrict:"A",
		link: function(scope, elem, attrs){
			//console.log(scope);
			scope.checkForSetup();
		}
	}
});



AegisBlog.directive("post", function(){
	return{
		restrict:"A",
		scope:{
			_id:"="
		},
		link :	function(scope, elem, attrs){
			//console.log(scope);
			scope.$parent._id = attrs.post;

		}
	}
});

AegisBlog.directive("contenteditable", function(){
	return{
		restrict:"A",
		require:"?ngModel",
		link: function(scope, elem, attrs, ngModel){
			if(!ngModel){
				return;
			}
			ngModel.$render = function() {
				elem.html(ngModel.$viewValue || '');
			};
			elem.on('blur keyup change', function() {
				scope.$apply(read);
		  	});
		  	read();
		  	function read() {
			  	var html = elem.html();
			  	if( attrs.stripBr && html == '<br>' ) {
				  	html = '';
				}
				ngModel.$setViewValue(html);
          	}
		}
	}
});
AegisBlog.directive("editor", function($compile){
	return{
		restrict:"EA",
		require:"?ngModel",
		controller: function($scope, $element,$http,$location){
			$scope.$on('sortFile', function(evt, file){
				var fType = file.type.split("/");
				if(fType[0] =='image'){
					if($scope.media.image[$scope.mediaIndex.image.index] == null){
						$scope.media.image[$scope.mediaIndex.image.index] = [];
						$scope.mediaIndex.image.dirty = true;
					}
					$scope.media.image[$scope.mediaIndex.image.index].push(file.name);
				}
				else if(fType[0] == 'audio'){
					if($scope.media.audio[$scope.mediaIndex.audio.index]==null){
						$scope.media.audio[$scope.mediaIndex.audio.index] = [];
						$scope.mediaIndex.audio.dirty = true;
					}
					$scope.media.audio[$scope.mediaIndex.audio.index].push(file.name);
				}
				else if(fType[0] == 'video'){
					if($scope.media.video[$scope.mediaIndex.video.index] == null){
						$scope.media.video[$scope.mediaIndex.video.index] = [];
						$scope.mediaIndex.video.dirty = true;
					}
					$scope.media.video[$scope.mediaIndex.video.index].push(file.name);
				}
			});
			$scope.$on('addElements', function(){
				if($scope.mediaIndex.image.dirty){
					$scope.$emit('imageGalleryChoice');
				}
				if($scope.mediaIndex.video.dirty){
					$scope.$emit('insertVideos');
				}
				if($scope.mediaIndex.audio.dirty){
					$scope.$emit('insertAudio');
				}
			});
			$scope.$on('insertImages', function(evt,option){
				var editarea = angular.element(document.querySelector("#editorarea"));
				if(option=='gallery'){
					var im =  angular.element($compile("<aegis-gallery contenteditable='false'  src='loc+_id+media.image["+$scope.mediaIndex.image.index+"]'></aegis-gallery><div class='pad-small'></div><br/>")($scope));
					editarea.append(im);
				}else{
					for(var i = 0;i<$scope.media.image[$scope.mediaIndex.image.index].length;i++){
						var im =  angular.element($compile("<img ng-src='{{loc}}{{_id}}"+$scope.media.image[$scope.mediaIndex.image.index][i]+"'/><br/>")($scope));
						editarea.append(im);
					}
				}
				$scope.mediaIndex.image.index++;
				$scope.mediaIndex.image.dirty = false;
			});
			$scope.$on('insertVideos',function(){
				var editarea = angular.element(document.querySelector("#editorarea"));
				for(var i = 0;i<$scope.media.video[$scope.mediaIndex.video.index].length;i++){
					var vi =  angular.element($compile("<aegis-video contenteditable='false' src='loc+_id+media.video["+$scope.mediaIndex.video.index+"]["+i+"]'></aegis-video><div class='pad-small'></div><br/>")($scope));
					editarea.append(vi);
				}
				$scope.mediaIndex.video.index++;
				$scope.mediaIndex.video.dirty = false;
			});
			$scope.$on('insertAudio', function(){
				var editarea = angular.element(document.querySelector("#editorarea"));
				for(var i = 0;i<$scope.media.audio[$scope.mediaIndex.audio.index].length;i++){
					var au =  angular.element($compile("<aegis-audio contenteditable='false'  src='loc+_id+media.audio["+$scope.mediaIndex.audio.index+"]["+i+"]'></aegis-audio><div classs='pad-small'></div><br/>")($scope));
					editarea.append(au);
				}
				$scope.mediaIndex.audio.index++;
				$scope.mediaIndex.audio.dirty = false;
			});

			$scope.styleText = function(opt){
				if (window.getSelection) {
					//console.log(scope);
					$scope.selection = window.getSelection();
					var temp;
					//console.log(window.getSelection().getRangeAt(0));
					if($scope.selection.getRangeAt(0).startOffset == $scope.selection.getRangeAt(0).endOffset){
						//console.log("eho");
						//scope.editData = scope.editData +"<b></b>";
						//console.log(angular.element(document.querySelector("#editorarea")));//.setSelectionRange(scope.editData.length-4,scope.editData.length-4);
						var editArea = angular.element(document.querySelector("#editorarea"));
						editArea.html(editArea.html().replace(window.getSelection(), "<b>"+window.getSelection()+"</b>"));
						//temp = attrs.$$element[0].children[1].childNodes.length-1;
					}
					else{
					var editArea = angular.element(document.querySelector("#editorarea"));
					//console.log(b.html());
					switch (opt){
						case 'b':
							editArea.html(editArea.html().replace(window.getSelection().getRangeAt(0), "<b>"+window.getSelection().getRangeAt(0)+"</b>"));
							//temp = attrs.$$element[0].children[1].childNodes.length-1;
							//console.log(attrs);
							break;
						case 'i':
							editArea.html(editArea.html().replace(window.getSelection().getRangeAt(0), "<i>"+window.getSelection().getRangeAt(0)+"</i>"));
							break;
						case 'u':
							editArea.html(editArea.html().replace(window.getSelection().getRangeAt(0), "<u>"+window.getSelection().getRangeAt(0)+"</u>"));
							break;
					};
					//editArea[0].focus();
					//console.log("whoo");

					var range = document.createRange();
					//console.log(window.getSelection().getRangeAt(0));
					//console.log(attrs.$$element[0].children[1].childNodes.length);
					range.setStart(editArea[0] , $element[0].children[1].childNodes.length-1);
					range.collapse(true);
					$scope.selection.removeAllRanges();
					$scope.selection.addRange(range);
					editArea[0].focus();

					//console.log(editArea);
					//elem.replace(scope.selection, temp);
					//console.log(scope.editData);
					}
					//return window.getSelection();
				}
				else if (document.selection) {
						console.log("d");

					//return document.selection.createRange().text;
				}

			};
			$scope.savePostInit = function(){
				//console.log(scope);
				$scope.toPublish = true;
			}
			$scope.savePost = function(pub){
				var savePackage = {"title":$scope.title, "content_body":$scope.editData, "toPublish":false};
				console.log(savePackage);

				if(pub){
					//console.log(scope);
					$scope.toPublish = true;
					savePackage.toPublish = true;
				}
				else{
					//console.log("nope");
					$scope.toPublish = false;
				}
				$http.post("/savepostb", savePackage).success(function(data){
					console.log(data);
					$scope._id= data[2]+"/";
					$scope.loc = "posts/"+data[0]+"/"+data[1]+"/";
					//goto the dashboard
					$location.path("/Aegis");
				});

			}
			$scope.cancelPost = function(){
				console.log("cancel");
				//check for files in temp and get rid of them then return to Aegis dashboard
				$http.get("/cancelpostb").success(function(data){
						$location.path("/Aegis");
				});
			}

		},
		link: function(scope, elem, attrs, ngModel){
			/*
			scope.styleText = function(opt){
				if (window.getSelection) {
					//console.log(scope);
					scope.selection = window.getSelection();
					var temp;
					//console.log(window.getSelection().getRangeAt(0));
					if(scope.selection.getRangeAt(0).startOffset == scope.selection.getRangeAt(0).endOffset){
						//console.log("eho");
						//scope.editData = scope.editData +"<b></b>";
						//console.log(angular.element(document.querySelector("#editorarea")));//.setSelectionRange(scope.editData.length-4,scope.editData.length-4);
						var editArea = angular.element(document.querySelector("#editorarea"));
						editArea.html(editArea.html().replace(window.getSelection(), "<b>"+window.getSelection()+"</b>"));
						//temp = attrs.$$element[0].children[1].childNodes.length-1;
					}
					else{
					var editArea = angular.element(document.querySelector("#editorarea"));
					//console.log(b.html());
					switch (opt){
						case 'b':
							editArea.html(editArea.html().replace(window.getSelection().getRangeAt(0), "<b>"+window.getSelection().getRangeAt(0)+"</b>"));
							//temp = attrs.$$element[0].children[1].childNodes.length-1;
							//console.log(attrs);
							break;
						case 'i':
							editArea.html(editArea.html().replace(window.getSelection().getRangeAt(0), "<i>"+window.getSelection().getRangeAt(0)+"</i>"));
							break;
						case 'u':
							editArea.html(editArea.html().replace(window.getSelection().getRangeAt(0), "<u>"+window.getSelection().getRangeAt(0)+"</u>"));
							break;
					};
					//editArea[0].focus();
					//console.log("whoo");

					var range = document.createRange();
					//console.log(window.getSelection().getRangeAt(0));
					//console.log(attrs.$$element[0].children[1].childNodes.length);
					range.setStart(editArea[0] , attrs.$$element[0].children[1].childNodes.length-1);
					range.collapse(true);
					scope.selection.removeAllRanges();
					scope.selection.addRange(range);
					editArea[0].focus();

					//console.log(editArea);
					//elem.replace(scope.selection, temp);
					//console.log(scope.editData);
					}
					//return window.getSelection();
				}
				else if (document.selection) {
						console.log("d");

					//return document.selection.createRange().text;
				}

			};
			*/
			scope.alignText = function(opt){
				if (window.getSelection) {
					//console.log(scope);
					scope.selection = window.getSelection();
					var temp;
					//console.log(window.getSelection().getRangeAt(0));
					if(scope.selection.getRangeAt(0).startOffset == scope.selection.getRangeAt(0).endOffset){
						//console.log("eho");
						//scope.editData = scope.editData +"<b></b>";
						//console.log(angular.element(document.querySelector("#editorarea")));//.setSelectionRange(scope.editData.length-4,scope.editData.length-4);
						var editArea = angular.element(document.querySelector("#editorarea"));
						editArea.html(editArea.html().replace(window.getSelection(), "<b>"+window.getSelection()+"</b>"));
						//temp = attrs.$$element[0].children[1].childNodes.length-1;
					}
					else{
					var editArea = angular.element(document.querySelector("#editorarea"));
					//console.log(b.html());
					switch (opt){
						case 'l':
							editArea.html(editArea.html().replace(window.getSelection().getRangeAt(0), "<div class='alignLeft'>"+window.getSelection().getRangeAt(0)+"</div>"));
							//temp = attrs.$$element[0].children[1].childNodes.length-1;
							//console.log(attrs);
							break;
						case 'c':
							editArea.html(editArea.html().replace(window.getSelection().getRangeAt(0), "<div class='alignCenter'>"+window.getSelection().getRangeAt(0)+"</div>"));
							break;
						case 'r':
							editArea.html(editArea.html().replace(window.getSelection().getRangeAt(0), "<div class='alignRight'>"+window.getSelection().getRangeAt(0)+"</div>"));
							break;
					};
					//editArea[0].focus();
					//console.log("whoo");

					var range = document.createRange();
					//console.log(window.getSelection().getRangeAt(0));
					//console.log(attrs.$$element[0].children[1].childNodes.length);
					range.setStart(editArea[0] , attrs.$$element[0].children[1].childNodes.length-1);
					range.collapse(true);
					scope.selection.removeAllRanges();
					scope.selection.addRange(range);
					editArea[0].focus();

					//console.log(editArea);
					//elem.replace(scope.selection, temp);
					//console.log(scope.editData);
					}
					//return window.getSelection();
				}
				else if (document.selection) {
						console.log("d");

					//return document.selection.createRange().text;
				}
			};

			scope.addHyperlink = function(){
				scope.selection = window.getSelection().getRangeAt(0);
				scope.hyperlink = !scope.hyperlink;
			}
			scope.addLink = function(){
				console.log(scope);
				console.log(this);
				if(this.hyperlinkSrc !=null){
					var editArea = angular.element(document.querySelector("#editorarea"));
					editArea.html(editArea.html().replace(scope.selection, "<a href='"+this.hyperlinkSrc+"'>"+scope.selection+"</a>"));
				}
				scope.hyperlink = !scope.hyperlink;
			}

			scope.editTitle = function(){
				var title = angular.element(document.querySelector("#postTitle"));
				console.log(title);

			}


			scope.addGallery = function(newlist){
				scope.medialist.push(newlist);
				//console.log(scope);
				var temp = angular.element($compile("<aegis-gallery glist='medialist["+scope.mediacount+"]'></aegis-gallery>")(scope));
				scope.mediacount++;
				//var newItem = angular.element($compile("<aegis-gallery glist='newlist'></aegis-gallery>")(scope));
				angular.element(document.querySelector("#editorarea")).append(temp);
			}
			scope.addImage = function(newImage){
				scope.medialist.push(newImage);
				var temp = angular.element($compile("<img ng-src='medialist["+scope.mediacount+"]'/>")(scope));
				scope.mediacount++;
				angular.element(document.querySelector("#editorarea")).append(temp);
			}
			scope.addVideo = function(newVideo){
				scope.medialist.push(newVideo);
				var temp = angualar.element($compile("<aegis-video src='medialist["+scope.mediacount+"]'></aegis-video>"));
				scope.mediacount++;
				angular.elemenet(document.querySelector("#editorarea")).append(temp);
			}
			scope.addUploading = function(){
				//console.log('add');
				//scope.medialist.push(newImage);
				var temp = angular.element($compile("<aegis-loading-object-block></aegis-loading-object-block>")(scope));
				//scope.mediacount++;
				angular.element(document.querySelector("#editorarea")).append(temp);
			}
		}
	}
});

AegisBlog.directive("aegisLoadingObjectBlock", function(){
	return{
		restrict:"E",
		link:function(scope, elem, attrs){
			//alert("WHAT");
		},
		template: function(elem, attrs){
			return "<div id='uploadingBlock' class='uploadingBlock' contenteditable='false'><div class='uploadContainer' ><div id='uploadingBlockCurrProgress' class='uploadingBlockCurrProgress' ></div></div></div>"
		}
	}
});


AegisBlog.controller("aegisTestController", function($scope){
	$scope.videoFi = "v.mp4";
	$scope.audioFi = "02_Hargrove.m4a";
	$scope.gallerylist=["av8.jpg","av9.png","av10.jpg", "h.png", "ab.png", "av1.jpg", "av2.jpg","av3.png", "av4.jpg", "av5.jpeg", "av6.jpg", "av7.png", "ib3.png","mj_desk.jpg"];
	$scope.templist = ["hey", "two","what"];
});

AegisBlog.controller("AegisPlatformEditorBeta", function($scope,$compile){
	angular.element(document.querySelector("title")).html("Aegis - Editor Beta");
	$scope.medialist = [];
	$scope.mediacount = 0;


	$scope.selection ="";
	$scope.selection2 = "";
	$scope.title="";
	$scope.hyperlink=false;
	$scope.toPublish = false;
	$scope.dropCount = false;
	$scope.titleEdit = false;
	$scope._id="temp/";
	$scope.loc = "posts/";
	$scope.title="Untitled";
	$scope.hasBeenEdited= false;

	$scope.media = {"audio":[],"video":[],"image":[]};
	$scope.mediaIndex={"audio":{"index":0,"dirty":false},"video":{"index":0,"dirty":false},"image":{"index":0,"dirty":false}};

	$scope.$on('imageGalleryChoice', function(){
		//console.log('image');
		$scope.$apply(function(){
			$scope.dropCount = true;
		});

	});
	$scope.imagesType = function(imgOption){
		$scope.dropCount = false;
		if(imgOption == 'gallery'){
			$scope.$emit('insertImages', 'gallery');
		}else{
			$scope.$emit('insertImages', 'single');
		}
	}

});
