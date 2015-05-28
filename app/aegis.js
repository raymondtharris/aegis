var Aegis = angular.module('Aegis',[]);

Aegis.service('$files', function($rootScope,$http){
	var currentProgress;
	var uploadSize;
	var currentFileSize;
	this.upload = function(fileList){
		currentProgress= 0;
		uploadSize=0;
		for(var i = 0; i < fileList.length; i++){
			uploadSize +=fileList[i].size;
		}
		//console.log(uploadSize);
		for(var i = 0; i < fileList.length; i++){
			var xmlHttpReq = new XMLHttpRequest();
			currentFileSize = fileList[i].size;
			xmlHttpReq.open("POST", "/sendfile");
			
			xmlHttpReq.setRequestHeader('X_FILE_NAME', fileList[i].name);
			xmlHttpReq.setRequestHeader('X_FILE_SIZE', fileList[i].size);
			xmlHttpReq.setRequestHeader('X-Requested-With', true);
			xmlHttpReq.setRequestHeader('Content-Type', fileList[i].type);
			
			xmlHttpReq.upload.addEventListener("progress", this.uploadProgress, false);
			xmlHttpReq.upload.addEventListener("loadstart", this.uploadStart, false);
			//xmlHttpReq.upload.addEventListener("loadend", this.uploadEnd(xmlHttpReq.upload, fileList[i]), false);
			xmlHttpReq.addEventListener("load", this.uploadComplete(xmlHttpReq, fileList[i]), false);
			//xmlHttpReq.addEventListener("error", this.uploadFailed, false);
			//xhr.addEventListener("abort", uploadCanceled, false)
			xmlHttpReq.send(fileList[i]);
			if(i == fileList.length-1){
				this.allFiles(fileList);
			}
		}
	}
	var getUploadSize = function(){
		return uploadSize;
	}
	this.uploadStart = function(){
		$rootScope.$broadcast('started');
	}
	this.uploadProgress = function(evt){
		
		currentProgress += Math.round(evt.loaded * 100 / uploadSize);
		
		$rootScope.$broadcast('uploadProgress', currentProgress);
	}
	this.uploadComplete = function(req, file){
		//console.log(req);
		$rootScope.$broadcast('uploadComplete',file);
	}
	this.uploadFailed = function(){
		
	}
	this.uploadEnd = function(req, file){
		console.log('fi');
		//$rootScope.$broadcast('uploadComplete', file);	 
	 }
	this.allFiles = function(fileList){
		$rootScope.$broadcast('uploadCompleted',fileList);
	}
	
});

Aegis.directive('draggable', function(){
	return{
		restrict:'A',
		scope:{
			sourceElement:'='
		},
		controller: function($scope, $element){
			$scope.sourceElement = $element[0];
			$scope.sourceElement.draggable = true;
			
			$element.on('dragstart', function(evt){
				evt.dataTransfer.effectAllowed ="all";
				evt.dataTransfer.setData('text/html', this.innerHTML);
			});
			$element.on('dragend', function(evt){
				
			});
		}
	}
});

Aegis.directive('droppable', function(){
	return{
		restrict:'A',
		scope:{
			progress:'='
		},
		controller: function($scope, $element, $files){
			$scope.progress = $files.currentProgress;
			
			$element.on('dragover', function(evt){
				evt.dataTransfer.dropEffect ="all";
				if(evt.preventDefault) evt.preventDefault();
			});
			$element.on('dragenter', function(evt){
				
			});
			$element.on('dragleave', function(evt){
				
			});
			$element.on('drop', function(evt){
				if(evt.preventDefault) evt.preventDefault();
				if(evt.dataTransfer.files.length >0){
					var filesList = evt.dataTransfer.files;
					$files.upload(filesList);
					
				}
				else{
					$element.append(evt.target.getData("text/html"));
				}
			});
			$scope.$on('started', function(){
				//console.log('upload started');
			});
			$scope.$on('uploadProgress', function(evt, progress){
				//console.log(progress);
			});
			$scope.$on('uploadComplete', function(evt, file){
				$scope.$emit('sortFile', file);	
			});	
			$scope.$on('uploadCompleted', function(){
				$scope.$emit('addElements');
			});
		}
	}
});

Aegis.directive("file", function(){
	return{
		scope:{
			file:'=',
		},
		controller: function($scope, $element, $files){
			$scope.newFiles = function(fileList){
				//console.log('what');
				//$scope.$apply( function(){
				
				$files.upload(fileList);
				//});
			}	
		},
		link: function(scope, elem, attrs){
			elem.bind('change',function(evChange){
				var files = evChange.target.files;
				scope.fileList = [];
				//scope.$apply( function(){
					
					scope.newFiles(files);
				//});
				
			});
		}
	}
});

Aegis.directive("dropDown", function(){
	return{
		scope:{
			obj:'=',
			options:'=',
			ngModel:'=',
			mod:'='
		},
		restrict:'E',
		controller: function($scope, $element){
			$scope.opt = $scope.options;
			if($scope.obj!=null){
				console.log($scope.obj)
			}	
			else
				$scope.currentSelection=$scope.options[0];
			$scope.dropped=false;
			$scope.dropdownInit = function(){
				$scope.dropped=!$scope.dropped;
				//console.log("drop");
			}
			$scope.changeSelection = function(){
				//console.log(this.$index);
				$scope.currentSelection = $scope.options[this.$index];
				$scope.ngModel=$scope.currentSelection;
				$scope.dropped=false;
			}
			$scope.$watch("options", function(){
				console.log($scope.options);
			})
		},
		link:function(scope, elem,attrs){
			//console.log(scope.options);
			//scope.currentSelection = scope.options[0];
			
		},
		template: function(elem, attrs){
			return "<div class='clickable aegisFont aegisRed' style='padding:4px 20px;text-align:center;width:100px;' ng-click='dropdownInit()' ng-model='ngModel'><div>{{currentSelection}}</div></div><div ng-if='dropped' style='border:1px solid #b33322; border-radius:10px;width:100px;padding:4px 20px;position:absolute;background:#fff; margin-top:14px;box-shadow: 0px 6px 14px 1px #aaa;' ><div style='width: 0;height: 0;border-style: solid;border-width: 0 20px 16px 20px;border-color: transparent transparent #b33322 transparent;margin-left:30px;margin-top:-20px;'></div><div style='width: 0;height: 0;border-style: solid;border-width: 0 20px 16px 20px;border-color: transparent transparent #fff transparent;margin-left:30px;margin-top:-15px;'></div><div ng-repeat='t in options' style='padding:4px 0px;text-align:center;width:100px;' class='aegisFont aegisRed clickable' ng-click='changeSelection()' >{{t}}</div></div>"
		
		}
		
	}
});

