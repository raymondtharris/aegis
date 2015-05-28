var AegisMedia = angular.module("aegisMedia",[]);

AegisMedia.service("$timing", function(){
	this.formTime = function(newTime){
		var dat = new Date(newTime*1000);
		var hh = dat.getUTCHours();
		var mm = dat.getUTCMinutes();
		var ss = dat.getUTCSeconds();
		if (hh < 10) {hh = "0"+hh;}
		if (mm < 10) {mm = "0"+mm;}
		if (ss < 10) {ss = "0"+ss;}
		if(hh>0)
			return hh+":"+mm+":"+ss;
		else
			return mm+":"+ss;
	}
});

AegisMedia.directive("aegisGallery", function(){
	return{
		restrict:"E",
		scope:{
			currentImage:"&",
			gallerySource:"=src"
		},
		controller:function($scope, $element){
			var path = '/posts/temp/';
			var galleryIndex = 0;
			$scope.gallery=true;
			
			$scope.stepGalleryF = function(){
				if(galleryIndex+1 < $scope.gallerySource.length){
					galleryIndex++;
					$scope.currentImage = $scope.gallerySource[galleryIndex];
				}
			}
			$scope.stepGalleryB = function(){
				if(galleryIndex-1 >-1){
				galleryIndex--;
				$scope.currentImage = $scope.gallerySource[galleryIndex];
				}
			}
			$scope.galleryToggle = function(){
				$scope.gallery=true;
			}
			$scope.selectPhoto = function(chosenImage){
				$scope.currentImage = chosenImage.images
				galleryIndex = chosenImage.$index;
				$scope.gallery=false;
			}
			$scope.hideControls = function(){
				angular.element($element[0].querySelector(".aegisGalleryControls")).css("visibility","hidden");
				
			}
			$scope.showControls = function(){
				angular.element($element[0].querySelector(".aegisGalleryControls")).css("visibility","visible");
			}
			$scope.controlsHover = function(){
				if(!$scope.gallery){
					setTimeout($scope.hideControls, 500);
				}
			}
			$scope.controlsShow = function(){
				if(!$scope.gallery){
					setTimeout($scope.showControls, 20);
				}
			}
		},
		template: 
		"<div class='aegisGallery' ng-mouseleave='controlsHover()' ng-mouseenter='controlsShow()'>"+
			"<div ng-if='!gallery' class='aegisGalleryControls'>"+
				"<div class='aegisGalleryControlsBacking'></div>"+
				"<div class='aegisGalleryControlsContainer'>"+
				"<button ng-click='galleryToggle()' class='aegisFont aegisButton aegisGalleryButton'>Gallery</button>"+
				"<button class='aegisFont aegisButton aegisBackButton' ng-click='stepGalleryB()'> < </button>"+
				"<button class='aegisFont aegisButton aegisForwardButton'  ng-click='stepGalleryF()'> > </button></div>"+
			"</div>"+
			"<div ng-if='gallery' class='aegisGalleryAllImages'>"+
				"<div class='aegisGalleryImageDiv' ng-repeat='images in gallerySource'>"+
				"<img class='aegisGalleryImage' id='image{{$id}}' ng-click='selectPhoto(this)' ng-src='{{images}}'/>"+
				"</div>"+
			"</div>"+
			"<div ng-if='!gallery' class='aegisGalleryViewingDiv'><img class='aegisGalleryViewingImage' ng-src='{{currentImage}}'/></div>"+
		"</div>",
		link:function(scope, element, attrs){
		}
	}
});

AegisMedia.directive("canvasDraw", function(){
	return {
		restrict:'A',
		scope:{
			
		},
		link:function(scope, element, attrs){
			console.log(element);
			var canvasContex = element[0].getContext('2d');
			
			function drawVisualizer(){
				
			}
			
		}
		
	}
});


AegisMedia.directive("aegisAudio", function(){
	return{
		restrict:"E",
		scope:{
			mediaSource:"=src",
			audioElement:"&",
			audioProgress:'&',
			audioElement:"&",
			audioCurrentTime:"&",
			audioDuration:"&",
			audioVolume:"&",
			name:'&',
			visualizer:'&',
			visualChanger:'&',
			canvasElement:'&'
		},
		template:"<div class='aegisAudioPlayer'>"+
			"<div style='width:400px; height:400px;background:#ccc;margin:auto;' >"+
				"<div ng-if='!visualizer'>"+
					"<div style='width:400px; height:400px;margin:auto;' class='aegisVisualContainer'></div>"+
				"</div>"+
				"<div ng-if='visualizer'>"+
					"<div style='width:400px; height:400px;margin:auto;'>"+
					"</div>"+
				"</div>"+
				"<div ng-click='changeViz()' style='margin:auto;position:relative;top:-50px;width:400px;text-align:center;' id='optionText'>{{optionText}}</div>"+
			"</div>"+
			"<div class='aegisAudioControlsTime'><div class='aegisAudioTime'>{{audioCurrentTime}}</div>"+
			"<input type='range' ng-model='audioProgress' class='aegisAudioProgress' ng-mousedown='startSeek(this)' ng-mouseup='seekToTime(this)' max='1'/>"+
			"<div class='aegisAudioTime'>{{audioDuration}}</div></div>"+
			"<div class='aegisAudioDescription'><div>{{audioName}}</div></div>"+
			"<div class='aegisAudioMiddleControls'><button ng-click='togglePlayback()' class='audioButton aegisAudioPlayButton' style='margin:auto;'></button></div>"+
			"<div class='aegisAudioVolumeControls'><div class='audioButton aegisAudioLowVolume'>"+
			"</div><input type='range' ng-model='audioVolume' class='aegisAudioVolume' min='0' max='1' step='0.025'/><div class='audioButton aegisAudioHighVolume'></div></div>"+
			"<audio class='aegisAudioSrc' ng-src='{{mediaSource}}'></audio>"+
		"</div>",
		controller:function($scope,$element, $timing){
			var scrubInterval;
			$scope.audioElement = $element[0].childNodes[0].lastChild;
			$scope.audioVolume=0.5;
			$scope.audioProgress = 0;
			$scope.visualizer = false;
			$scope.optionText = 'Visualizer';
			$scope.audioVis;
			$scope.canvasElement;
			
			var source;
			var paused = true;
						
			$scope.$watch('audioVolume', function(evt){
				$scope.audioElement.volume=$scope.audioVolume;
				var vol = angular.element($element[0].querySelector(".aegisAudioVolume"));
				var newValue = (vol[0].value - vol[0].min)/(vol[0].max-vol[0].min);
				vol.css('background-image','-webkit-gradient(linear, left top, right top, '+ 'color-stop(' + newValue + ', #333), '+ 'color-stop(' + newValue + ', #bbb)'+ ')');
			});
			$scope.audioElement.addEventListener("loadedmetadata", function(evt){
				
				$element[0].childNodes[0].childNodes[1].childNodes[1].max = evt.target.duration;
				$scope.audioDuration = $timing.formTime(evt.target.duration);
				var str = $scope.mediaSource.split('/');
				$scope.audioName = str[str.length-1];
				//$scope.audioName = $scope.mediaSource;
				//console.log(angular.element(document.querySelector('')));
			});
			
			$scope.audioElement.addEventListener("timeupdate", function(evt){
				$scope.$apply(function(){
					$scope.audioProgress = evt.target.currentTime;
					$scope.audioCurrentTime = $timing.formTime(evt.target.currentTime);
					var prog = angular.element($element[0].querySelector(".aegisAudioProgress"));
					var newValue = (prog[0].value - prog[0].min)/(prog[0].max-prog[0].min);
					prog.css('background-image','-webkit-gradient(linear, left top, right top, '+ 'color-stop(' + newValue + ', #333), '+ 'color-stop(' + newValue + ', #bbb)'+ ')');
				})
				
			});
			$scope.audioElement.addEventListener("ended", function(evt){
				var pbutton = angular.element($element[0].querySelector(".aegisAudioPauseButton"));
				pbutton.addClass("aegisAudioPlayButton");
				pbutton.removeClass("aegisAudioPauseButton");
			});
			$scope.startSeek = function(evt){
				$scope.audioElement.pause();
				$scope.$watch('audioProgress', function(){
					$scope.audioCurrentTime = $timing.formTime($scope.audioProgress);
				});
				
			}
			$scope.seekToTime = function(evt){
				$scope.audioElement.currentTime = evt.audioProgress;
				$scope.audioElement.play();	
			}
			
			$scope.togglePlayback = function(){
				if(!$scope.audioElement.paused){
					var pbutton = angular.element($element[0].querySelector(".aegisAudioPauseButton"));
					pbutton.addClass("aegisAudioPlayButton");
					pbutton.removeClass("aegisAudioPauseButton");
					$scope.audioElement.pause();
					
				}
				else{
					var pbutton = angular.element($element[0].querySelector(".aegisAudioPlayButton"));
					pbutton.addClass("aegisAudioPauseButton");
					pbutton.removeClass("aegisAudioPlayButton");
					$scope.audioElement.play();
					
				}
			
			}
			$scope.showOptions= function(opt){
				if(opt)
					angular.element($element[0].querySelector("#optionText")).css("visibility","visible");
				else
					angular.element($element[0].querySelector("#optionText")).css("visibility","hidden");
				$scope.visualChanger = opt;
			}
			$scope.changeViz = function(){
				$scope.visualizer=!$scope.visualizer;
				if($scope.visualizer){
					$scope.optionText = 'Album Art';
								
				}
				else
					$scope.optionText = 'Visualizer';
			}
	
			
		},
		link: function(scope, elem, attrs){
			console.log(scope.mediaSource);
	
		}
	}
});
AegisMedia.directive("aegisAudioExp", function(){
	return{
		restrict:"E",
		scope:{
			mediaSource:"=src",
			audioElement:"&",
			audioProgress:'&',
			audioElement:"&",
			audioCurrentTime:"&",
			audioDuration:"&",
			audioVolume:"&",
			name:'&',
			visualizer:'&',
			visualChanger:'&',
			canvasElement:'&'	
		},
		template:"<div class='aegisAudioPlayer'>"+
			"<div style='width:400px; height:400px;background:#ccc;margin:auto;' ng-mouseenter='showOptions(true)' ng-mouseleave='showOptions(false)' >"+
				"<div ng-if='!visualizer'>"+
					"<div style='width:400px; height:400px;margin:auto;' class='aegisVisualContainer'></div>"+
				"</div>"+
				"<div ng-if='visualizer'>"+
					"<div style='width:400px; height:400px;margin:auto;'>"+
						"<canvas canvas-draw width='400' height='400' id='canvas'></canvas>"+
					"</div>"+
				"</div>"+
				"<div ng-click='changeViz()' style='margin:auto;position:relative;top:-50px;width:400px;text-align:center;' id='optionText'>{{optionText}}</div>"+
			"</div>"+
			"<div class='aegisAudioControlsTime'><div class='aegisAudioTime'>{{audioCurrentTime}}</div>"+
			"<input type='range' ng-model='audioProgress' class='aegisAudioProgress' ng-mousedown='startSeek(this)' ng-mouseup='seekToTime(this)' max='1'/>"+
			"<div class='aegisAudioTime'>{{audioDuration}}</div></div>"+
			"<div class='aegisAudioDescription'><div>{{audioName}}</div></div>"+
			"<div class='aegisAudioMiddleControls'><button ng-click='togglePlayback()' class='audioButton aegisAudioPlayButton' style='margin:auto;'></button></div>"+
			"<div class='aegisAudioVolumeControls'><div class='audioButton aegisAudioLowVolume'>"+
			"</div><input type='range' ng-model='audioVolume' class='aegisAudioVolume' min='0' max='1' step='0.025'/><div class='audioButton aegisAudioHighVolume'></div></div>"+
			"<audio class='aegisAudioSrc' ng-src='{{mediaSource}}'></audio>"+
		"</div>",
		controller:function($scope,$element, $timing){
			var scrubInterval;
			$scope.audioElement = $element[0].childNodes[0].lastChild;
			$scope.audioVolume=0.5;
			$scope.audioProgress = 0;
			$scope.visualizer = false;
			$scope.optionText = 'Visualizer';
			$scope.audioVis;
			$scope.canvasElement;
			//console.log($element[0].firstChild.firstChild.childNodes[2]);
				//var t = angular.element(Document.querySelector('#fire'));
				//console.log(t);
				//t.getContext('2d');	
			var source;
			var paused = true;
						
			$scope.$watch('audioVolume', function(evt){
				$scope.audioElement.volume=$scope.audioVolume;
				var vol = angular.element($element[0].querySelector(".aegisAudioVolume"));
				var newValue = (vol[0].value - vol[0].min)/(vol[0].max-vol[0].min);
				vol.css('background-image','-webkit-gradient(linear, left top, right top, '+ 'color-stop(' + newValue + ', #333), '+ 'color-stop(' + newValue + ', #bbb)'+ ')');
			});
			$scope.audioElement.addEventListener("loadedmetadata", function(evt){
				
				$element[0].childNodes[0].childNodes[1].childNodes[1].max = evt.target.duration;
				$scope.audioDuration = $timing.formTime(evt.target.duration);
				
				
					$scope.audioName = $scope.mediaSource;
				//console.log(angular.element(document.querySelector('')));
			});
			
			$scope.audioElement.addEventListener("timeupdate", function(evt){
				$scope.$apply(function(){
					$scope.audioProgress = evt.target.currentTime;
					$scope.audioCurrentTime = $timing.formTime(evt.target.currentTime);
					var prog = angular.element($element[0].querySelector(".aegisAudioProgress"));
					var newValue = (prog[0].value - prog[0].min)/(prog[0].max-prog[0].min);
					prog.css('background-image','-webkit-gradient(linear, left top, right top, '+ 'color-stop(' + newValue + ', #333), '+ 'color-stop(' + newValue + ', #bbb)'+ ')');
				})
				
			});
			$scope.startSeek = function(evt){
				$scope.audioElement.pause();
				$scope.$watch('audioProgress', function(){
					$scope.audioCurrentTime = $timing.formTime($scope.audioProgress);
				});
				
			}
			$scope.seekToTime = function(evt){
				$scope.audioElement.currentTime = evt.audioProgress;
				$scope.audioElement.play();	
			}
			
			$scope.togglePlayback = function(){
				if(!$scope.audioElement.paused){
					var pbutton = angular.element($element[0].querySelector(".aegisAudioPauseButton"));
					pbutton.addClass("aegisAudioPlayButton");
					pbutton.removeClass("aegisAudioPauseButton");
					//$scope.audioElement.pause();
					
				}
				else{
					var pbutton = angular.element($element[0].querySelector(".aegisAudioPlayButton"));
					pbutton.addClass("aegisAudioPauseButton");
					pbutton.removeClass("aegisAudioPlayButton");
					//$scope.audioElement.play();
					//source.start();
				}
				if(paused){
					var pbutton = angular.element($element[0].querySelector(".aegisAudioPlayButton"));
					pbutton.addClass("aegisAudioPauseButton");
					pbutton.removeClass("aegisAudioPlayButton");
					source.noteOn(0);
					paused = false;
				}
				else if(!paused){
					var pbutton = angular.element($element[0].querySelector(".aegisAudioPauseButton"));
					pbutton.addClass("aegisAudioPlayButton");
					pbutton.removeClass("aegisAudioPauseButton");
					source.stop(0);
					paused = true;
				}
			}
			$scope.showOptions= function(opt){
				if(opt)
					angular.element($element[0].querySelector("#optionText")).css("visibility","visible");
				else
					angular.element($element[0].querySelector("#optionText")).css("visibility","hidden");
				$scope.visualChanger = opt;
			}
			$scope.changeViz = function(){
				$scope.visualizer=!$scope.visualizer;
				if($scope.visualizer){
					$scope.optionText = 'Album Art';
								
				}
				else
					$scope.optionText = 'Visualizer';
			}
			var context, bufferLoader;
			
			window.onload = function(){
				var audioSrc= $element[0].firstChild.lastChild.currentSrc;
				console.log(audioSrc);
				window.AudioContext = window.AudioContext || window.webkitAudioContext;
				context = new AudioContext();
				//context = new webkitAudioContext();
				bufferLoader = new BufferLoader(context, [audioSrc], finishedLoading);
				bufferLoader.load();
			}
			function finishedLoading(bufferList){
				source = context.createBufferSource();
				source.buffer = bufferList[0];
				source.connect(context.destination);
				//source.start(0);
			}
			
		},
		link: function(scope, elem, attrs){

	
		}
	}
});


AegisMedia.directive('aegisVideo', function(){
	return{
		restrict:"E",
		scope:{
			mediaSource:"=src",
			videoVolume:'&',
			videoProgress:'&',
			videoElement:"&",
			videoCurrentTime:"&",
			videoDuration:"&"

		},
		template:
		"<div class='aegisVideoPlayer' ng-mouseleave='hideControls()' ng-mouseenter='showControls()'>"+
		 	"<video ng-src='{{mediaSource}}' style='width:100%;height:auto;'></video>"+
		 	"<div id='aegisVideoControlsTop'>"+
		 		"<div style='background:#fff;width:100%;height:60px;margin:auto;opacity:0.4;position:relative;top:-543px;'>"+
				"</div>"+
				"<div style='width:100%; height:60px;margin:auto;position:relative;top:-10px;position:relative;top:-583px;'>"+
					"<form name='progress' style='margin:auto;width:840px;'><span style='padding:0 15px;'>{{videoCurrentTime}}</span><input type='range'id='aegisVideoProgress' class='aegisVideoProgress' ng-model='videoProgress' ng-mousedown='startSeek(this)' ng-mouseup='seekToTime(this)'  max='1' step='0.05'/> <span style='padding:0 15px;'>{{videoDuration}}</span>"+
					//<button ng-click='toggleFullscreen()'>FS</button>
					"</form>"+
				"</div>"+
			"</div>"+
			"<div id='aegisVideoControlsBottum'>"+
			"<div style='width:100%; height:60px;margin:auto;background:#fff;position:relative;top:-122px;opacity:0.4;position:relative;top:-183px;'>"+	
			"</div>"+
			"<div style='width:100%;background:none;height:60px;margin:auto;position:relative;top:-160px;position:relative;top:-253px;'>"+
					"<form style='background:none;margin:auto;width:600px;margin-top:10px;'><input type='range' ng-model='videoVolume'  class='aegisVideoVolume' style='margin-top:-30px;' min='0' max='1' step='0.05'/>"+
					"<button ng-click='togglePlayback()' class='audioButton aegisAudioPlayButton' style='margin:0 100px;'></button>"+
					"<button ng-if='hasHD' ng-click='toggleHD()' id='aegisVideoHDButton' class='aegisFont' style='position:relative;top:-14px;width:60px;height:auto;font-size:20px;background:none;border-style:none;font-weight:bold;outline:none;'>HD</button></form>"+
			"</div>"+
			"</div>"+
		"</div>",
		controller: function($scope, $element, $timing){
			$scope.fullscreen=false;
			$scope.videoElement = $element[0].childNodes[0].firstChild;
			$scope.videoVolume=0.5;
			$scope.videoProgress = 0;
			$scope.HD = false;
			
			$scope.$watch('videoVolume', function(evt){
				$scope.videoElement.volume=$scope.videoVolume;
				var vol = angular.element($element[0].querySelector(".aegisVideoVolume"));
				var newValue = (vol[0].value - vol[0].min)/(vol[0].max-vol[0].min);
				vol.css('background-image','-webkit-gradient(linear, left top, right top, '+ 'color-stop(' + newValue + ', #333), '+ 'color-stop(' + newValue + ', #bbb)'+ ')');
			});
			$scope.videoElement.addEventListener("loadedmetadata", function(evt){
				angular.element($element[0].querySelector("#aegisVideoProgress"))[0].max = evt.target.duration;
				$scope.videoDuration = $timing.formTime(evt.target.duration);
			});
			$scope.videoElement.addEventListener("timeupdate", function(evt){
				$scope.$apply(function(){
					$scope.videoProgress = evt.target.currentTime;
					$scope.videoCurrentTime = $timing.formTime(evt.target.currentTime);
					var prog = angular.element($element[0].querySelector(".aegisVideoProgress"));
					var newValue = (prog[0].value - prog[0].min)/(prog[0].max-prog[0].min);
					prog.css('background-image','-webkit-gradient(linear, left top, right top, '+ 'color-stop(' + newValue + ', #333), '+ 'color-stop(' + newValue + ', #bbb)'+ ')');
				})
				
			});
			$scope.videoElement.addEventListener("ended", function(){
				var pbutton = angular.element($element[0].querySelector(".aegisAudioPauseButton"));
				pbutton.addClass("aegisAudioPlayButton");
				pbutton.removeClass("aegisAudioPauseButton");
			});
			$scope.startSeek = function(evt){
				$scope.videoElement.pause();
				$scope.$watch('videoProgress', function(){
					$scope.videoCurrentTime = $timing.formTime($scope.videoProgress);
				});
			}
			
			$scope.seekToTime = function(evt){
				$scope.videoElement.currentTime =  evt.videoProgress;
				$scope.videoElement.play();	
			}
			
			$scope.togglePlayback = function(){
				if(!$scope.videoElement.paused){
					var pbutton = angular.element($element[0].querySelector(".aegisAudioPauseButton"));
					pbutton.addClass("aegisAudioPlayButton");
					pbutton.removeClass("aegisAudioPauseButton");
					$scope.videoElement.pause();
					
				}
				else{
					var pbutton = angular.element($element[0].querySelector(".aegisAudioPlayButton"));
					pbutton.addClass("aegisAudioPauseButton");
					pbutton.removeClass("aegisAudioPlayButton");
					$scope.videoElement.play();
				}
			}
			
			$scope.hasHD = function(filename){
				$http.get('/hashd/'+filename).success(function(response){
					if(response)
						return true;
					else
						return false;
				});
			}
			$scope.toggleHD = function(){
				var temp = $scope.videoElement.currentTime;
				var hdButton = angular.element($element[0].querySelector("#aegisVideoHDButton"));
				if(!$scope.HD){
					var str = $scope.mediaSource.split(".");
					var newSrc = str[0]+"hd."+str[1];
					$scope.mediaSource = newSrc;
					hdButton.css("color","#fff");
				}else{
					var str = $scope.mediaSource.split("hd");
					var newSrc = str[0]+""+str[1];
					$scope.mediaSource = newSrc;
					hdButton.css("color","#000");
				}
				$scope.videoElement.currentTime  = temp;
				$scope.HD=!$scope.HD;
				
			}
			$scope.hideControls= function(){
				if(!$scope.videoElement.paused){
					setTimeout(function(){
					angular.element($element[0].querySelector("#aegisVideoControlsTop")).css("visibility","hidden");
					angular.element($element[0].querySelector("#aegisVideoControlsBottum")).css("visibility","hidden");},500);
				}
			}
			$scope.showControls= function(){
				if(!$scope.videoElement.paused){
					setTimeout(function(){
					angular.element($element[0].querySelector("#aegisVideoControlsTop")).css("visibility","visible");
					angular.element($element[0].querySelector("#aegisVideoControlsBottum")).css("visibility","visible");},100);
				}
			}
			
			$scope.toggleFullscreen = function(){
				/*
				console.log($element);
				if(!$scope.fullscreen){	
					if($element[0].firstChild.requestFullscreen){
						$element[0].firstChild.requestFullscreen();
					}
					else if($element[0].firstChild.webkitRequestFullscreen){
						$element[0].firstChild.webkitRequestFullscreen();
					}
					else if($element[0].firstChild.mozRequestFullscreen){
						$element[0].firstChild.mozRequestFullscreen();
					}
					//$element[0].firstChild.css('width','100%');
					$element[0].firstChild.style.width = '100%';
					//$element.css('height','auto');
				}else{
					if(document.exitFullscreen){
						document.exitFullscreen();
					}
					else if(document.webkitExitFullscreen){
						document.webkitExitFullscreen();

					}
					else if(document.mozCancelFullscreen){
						document.mozCancelFullscreen();
					}
					//$element[0].firstChild.css('width','960px');
					//$element[0].firstChild.css('height','auto');
				}
				*/
				$scope.fullscreen = !$scope.fullscreen;				
			}	
		},
		link:function(scope, element, attrs){
			scope.videoVolume=0.5;		
			
		}
	}
});

