var express = require("express");
var app = express();
var fs = require("fs");
var mongoose = require("mongoose");
var mongostore = require("connect-mongo")(express);


mongoose.connect('mongodb://localhost/aegis');

var AegisPostSchema = mongoose.Schema({
	title : String,
	body : String,
	template : [{obtype:String, val:String, align:String}],
	published : Boolean,
	date :{type: Date, default:Date.now},
	dateupdated: Date
});

var AegisPostSchemaNew = mongoose.Schema({
	title : String,
	body : String,
	published : Boolean,
	date :{type: Date, default:Date.now},
	dateupdated: Date
});

var AegisBlogSchema = mongoose.Schema({
	blogname: String,
	blogurl:{type:String, default:'http://localhost:8000'},
	themename: {type:String, default:'Aegis'},
	datecreated :{type: Date , default: Date.now},
	currentMonth:Number,
	currentYear:Number,
	pagination:{type:String, default:'Pages'},
	perPage:{type:Number, default:8}
});

var AegisUserSchema = mongoose.Schema({
	name: String,
	username: String,
	password: String
});
var AegisThemeSchema = mongoose.Schema({
	name : String,
	version: String,
	directory: String
});


var AegisPost = mongoose.model("AegisPostList", AegisPostSchema);
var AegisPostNew = mongoose.model("AegisPostListNew", AegisPostSchemaNew);

var AegisBlog = mongoose.model("AegisBlog", AegisBlogSchema);
var AegisUser = mongoose.model("AegisUser", AegisUserSchema);

app.use(express.bodyParser());
app.use(express.cookieParser());
app.use(express.session({
	secret: '5EKR3TC00K13',
	store: new mongostore({
		db:'aegis',
		host:'127.0.0.1',
		auto_reconnect:true
	})
}));
app.use(express.favicon());
app.use(express.static(__dirname + "/"));



var currentYear, currentMonth; // Keep track of year of month values for posts



var loadResouce = function(req, res){
	//console.log("getting themes");
	fs.readFile( __dirname + '/'+ req.params.resource +'.json', function (err, data) {
  if (err) {
    throw err;
  }
  //console.log(data.toString());
  res.send(data.toString());
  });
};

var fileuploader = function(req, res){
	//console.log(req.files);
	var f = req;
	//var name = "name"+0;
	//console.log(f.files.name[0]);
	var len = req.files.name.length;
	var j = 0;
	for(var i=0; i<req.files.name.length; i++){
		//console.log(req.files.name[i].path);
		var fName = req.files.name[i].name;
		//console.log("pre " +fName+ "  " +i );
		var path = __dirname + "/posts/temp/" + fName;

		var data = fs.readFileSync(req.files.name[i].path);
		//console.log(req.files.name[i].path);
		if(fs.existsSync(__dirname+"/posts/temp/")){
		fs.writeFileSync(path, data);
		fs.unlink(req.files.name[i].path);
		}
		else{
			fs.mkdirSync(__dirname+"/posts/temp/", 0777);
			fs.writeFileSync(path, data);
			fs.unlink(req.files.name[i].path);
		}
	}
	res.send(200);
};

var cancelpost = function(req, res){
	fs.exists(__dirname+"/posts/temp/", function(exists){
		if(exists){
			var t = fs.readdirSync(__dirname+"/posts/temp/");
			if(t.length >0){
				for(var i = 0; i<t.length;i++){
					fs.unlinkSync(__dirname+"/posts/temp/"+t[i]);
				}
			}

			fs.rmdirSync(__dirname+"/posts/temp/");
			res.send(202);
		}
		else{
			res.send(204);
		}
	});
};

var savepost = function(req, res){
	//console.log(req.body);
	fs.exists(__dirname+"/posts/temp/", function(exists){
		if(exists){
			//{obtype:req.body.template.obtype, val:req.body.template.val, align:req.body.template.align}
			var newPost = new AegisPost({title: req.body.title, body: "", template: [], published: false});
			var contentbody="";
			for(var i =0; i< req.body.template.length; i++){
				newPost.template.push({obtype:req.body.template[i].obtype, val:req.body.template[i].val, align:req.body.template[i].align});
				switch(req.body.template[i].obtype){
				case "text":
					contentbody = contentbody + "<div class='postText align"+req.body.template[i].align+"'>"+req.body.template[i].val+"</div>";
					break;
				case "image":
					contentbody = contentbody + "<img imageresizer class='postImage' src='/posts/"+newPost._id+"/"+req.body.template[i].val+"'/>";
					break;
				}
			}
			newPost.body  = contentbody;
			//newPost.template= req.body.template;
			//console.log(newPost);
			fs.renameSync(__dirname+"/posts/temp", __dirname+"/posts/"+newPost._id);
			newPost.save(function(err, postlist){
				//console.log(postlist);
				res.send(201);
			});

		}
		else{
			fs.mkdirSync(__dirname+"/posts/temp/", 0777);
			var newPost = new AegisPost({title: req.body.title, body: "", template: [], published: false});
			var contentbody="";
			for(var i =0; i< req.body.template.length; i++){
				newPost.template.push({obtype:req.body.template[i].obtype, val:req.body.template[i].val, align:req.body.template[i].align});
				switch(req.body.template[i].obtype){
				case "text":
					contentbody = contentbody + "<div class='postText align"+req.body.template[i].align+"'>"+req.body.template[i].val+"</div>";
					break;
				case "image":
					contentbody = contentbody + "<img imageresizer class='postImage' src='/posts/"+newPost._id+"/"+req.body.template[i].val+"'/>";
					break;
				}
			}
			//console.log(newPost.template);
			//newPost.template= req.body.template;
			fs.renameSync(__dirname+"/posts/temp", __dirname+"/posts/"+newPost._id);
			newPost.save(function(err, postlist){
				//console.log(postlist);
				res.send(201);
			});
		}
	});
	res.send(200);
};

var getPosts = function(req,res){
	AegisPost.find({}).sort({date:-1}).exec(function(err, postslist){
		//console.log(postslist);
		res.json(postslist);
	});
};

var getLatestPosts = function(req, res){
	AegisPost.find({}).sort({date:-1}).limit(6).exec(function(err, postslist){
		res.json(postslist);
	});
};

var delPost = function(req, res){
	//console.log(req.params.pid);
	AegisPost.find({_id: req.params.pid}, function(err, results){
		//console.log(results);
		fs.exists(__dirname+"/posts/"+req.params.pid, function(exists){
			if(exists){
				var t = fs.readdirSync(__dirname+"/posts/"+req.params.pid);
				for(var i = 0; i<t.length;i++){
					fs.unlinkSync(__dirname+"/posts/"+req.params.pid+"/"+t[i]);
				}
			fs.rmdirSync(__dirname+"/posts/"+req.params.pid);
			AegisPost.remove({_id:req.params.pid}, function(err, results){
				res.send(202);
			});

			}
			else{
				res.send(204);
			}
		});
	});
};
var getOnePost = function(req, res){
	AegisPost.findOne({_id: req.params.pid}, function(err, result){
		res.json(result);
	});
}


var updatepost = function(req, res){
	AegisPost.findOne({_id: req.body.pid}, function(err, result){
		//console.log(result);
		result.title = req.body.title;
		result.template = [];
		result.body = "";
		var contentbody = "";
		for(var i = 0; i< req.body.template.length; i++){
			result.template.push({obtype:req.body.template[i].obtype, val:req.body.template[i].val, align:req.body.template[i].align});
			switch(req.body.template[i].obtype){
				case "text":
					contentbody = contentbody + "<div class='postText align"+req.body.template[i].align+"'>"+req.body.template[i].val+"</div>";
					break;
				case "image":
					contentbody = contentbody + "<img imageresizer class='postImage' src='/posts/"+req.body.pid+"/"+req.body.template[i].val+"'/>";
					break;
			}
		}
		result.body = contentbody;
		var temp = Date.now();
		//console.log(temp);
		result.dateupdated = temp;
		//console.log(result);
		result.save(function(err, output){
			res.send(202);
		});

	});
};


var checkforsetup = function(req, res){
	fs.exists(__dirname + "/setup.json", function(exists){
		if(exists){
			res.send(true);
		}
		else{
			res.send(false);
		}
	});
};

var savesetup = function(req, res){
	console.log(req.body);
	var newUser = new AegisUser({name: req.body.name, username : req.body.username, password: req.body.password});
	var newBlog = new AegisBlog({blogname: req.body.blogname});
	var jsonData = {name: newUser.name, username: newUser.username, blogname: newBlog.blogname, userid: newUser._id, blogid: newBlog._id, created:newBlog.datecreated};
	console.log(jsonData);

	AegisUser.find({}, function(userlist){
		if(userlist!= null){
			for(var i=0; i< userlist.length;i++){
				AegisUser.findByIdAndRemove(userlist[i]._id);
			}
		}
		AegisBlog.find({}, function(bloglist){
			if(bloglist!=null){
				for(var j=0; j<bloglist.length; j++){
					AegisBlog.findByIdAndRemove(bloglist[j]._id);
				}
			}
			newUser.save(function(err, userresult){
				newBlog.save(function(err, blogresult){
					// Save setup.json file with jsonData
					fs.mkdirSync(__dirname+"/config", 0777);
					fs.writeFileSync(__dirname+"/config/setup.json", JSON.stringify(jsonData));

				});
			})
		});
	});


	// Check for posts directory
	fs.exists(__dirname+"/posts/", function(exists){
		if(exists){
			//read posts directory
			var postsDir = fs.readdirSync(__dirname+"/posts/");
			// loop through all files in posts directory
			for(var i = 0; i<postsDir.length;i++){
				fs.unlinkSync(__dirname+"/posts/"+postsDir[i]); //delete file
			}
		}
		else{
			fs.mkdirSync(__dirname+"/posts", 0777); //Create posts directory
		}
		// Add year posts directory
		var dateObj = new Date();
		fs.mkdirSync(_dirname+"/posts/"+ dateObj.getFullYear(), 0777);
		currentYear = dateObj.getFullYear();
		currentMonth = dateObj.getMonth();
	});

	res.send(201);

};

var userlogin = function(req, res){
	//console.log(req.body);
	AegisUser.findOne({'username':req.body.usernameInput, 'password': req.body.passwordHash}, function(err,userlist){
		console.log(userlist);
		if(userlist != null){
			req.session.name = userlist.name;
			req.session.pid = userlist._id;
			console.log(req.session);
			res.send(true);
		}
		else{
			res.send(false);
		}

	});
};

var getBlogData = function(req, res){
	AegisBlog.findOne({}, function(err, bloglist){
		res.json(bloglist);
	});
};

var cookieCheck = function(req,res){
	if(req.session.pid !=null){
		//console.log(req);
		res.json(true);
	}
	else{
		res.send(false);
	}
}

var postPublish = function(req, res){
	AegisPost.findOne({_id:req.params.pid}, function(err, resPost){
		resPost.published = !resPost.published;
		resPost.save(function(err, result){
			res.send(resPost.published);
		});
	});
};

var publishedPosts = function(req, res){
	AegisPost.find({published:true}).sort({date:-1}).exec(function(err, postslist){
		//console.log(postslist);
		res.json(postslist);
	});
};

var changeTheme = function(req, res){
	AegisBlog.findOne({_id:req.body.pid}, function(err, result){
		result.themename = req.body.name;
		result.save(function(err, finalSend){
			res.send(200);
		});
	});
};

var changeBlogName = function(req, res){
	AegisBlog.findOne({_id:req.body.pid}, function(err, result){
		result.blogname = req.body.name;
		result.save(function(err, finalSend){
			res.send(200);
		});
	});
};

var hasHD = function(req, res){
	//console.log(__dirname+req.params.filename);
	var newSrc = req.params.filename.split('.');
	if(fs.existsSync(__dirname+"/"+newSrc[0]+"hd."+newSrc[1])){
		res.send(true);
	}
	else{
		res.send(false);
	}
};


var nysize;
var tester = function(req, res){
	var writeout = req.body;
	fs.writeFileSync(__dirname+"/test.json", JSON.stringify(writeout));
	res.send(201);
};
var uploadedSize = 0;

var fileup = function(req,res){
	var myFile = fs.createWriteStream(__dirname+'/posts/temp/'+req.headers.x_file_name,{flag:'w+'});

	req.on('data', function(data){
		myFile.write(data);
		//req.pause();
	});
	myFile.on('drain',function(){
		//req.resume();
	});
	req.on('end', function(){
		myFile.end();
	})
	res.send(200);
};


//Save posts in the new format
var newsavepost = function(req, res){
	//create new post object from request data
	console.log(req.body);

	var tbody = req.body.content_body.split("temp");
	var finBody = ""+tbody[0];
	var newPost = new AegisPostNew({title: req.body.title, body: req.body.content_body, published: false});

	//console.log(newPost.date.getFullYear() +"  "+ newPost.date.getMonth());
	if(currentYear != newPost.date.getFullYear() || currentMonth != (newPost.date.getMonth()+1)){
		currentYear = newPost.date.getFullYear();
		currentMonth = newPost.date.getMonth()+1;
	}
	for(var i=1;i<tbody.length;i++){
		//console.log("part  "+ tbody[i]);
		finBody+= currentYear + "/" + currentMonth +"/"+newPost._id +tbody[i];

	}
	console.log(finBody);
	newPost.body = finBody;
	newPost.save(function(err, postlist){
		console.log('saved post data');
	});
	fs.exists(__dirname+"/posts/temp/", function(exists){ //Check if anything is in the temporary posts directory
		if(exists){
			//rename temp folder to reflect the media for the posts
			if(!fs.existsSync(__dirname+ "/posts/" + currentYear + "/" )){
				fs.mkdirSync(__dirname+"/posts/"+ currentYear + "/" , 0777);
			}
			if(!fs.existsSync(__dirname+ "/posts/" + currentYear + "/" + currentMonth + "/" )){
				fs.mkdirSync(__dirname+"/posts/"+ currentYear + "/"+ currentMonth + "/" , 0777);
			}
			fs.renameSync(__dirname+"/posts/temp/", __dirname + "/posts/" + currentYear + "/" + currentMonth + "/" +newPost._id);
			fs.writeFileSync(__dirname + "/posts/" + currentYear + "/" + currentMonth + "/" +newPost._id+"/post.json", JSON.stringify(newPost));
		}
		//make new temp folder
		fs.mkdirSync(__dirname+"/posts/temp", 0777);
	});

	res.json([currentYear, currentMonth, newPost._id]);
};

var skipTo=0;
var newgetposts = function(req, res){
	//console.log(req.params);
	var opt = req.params.option;
	switch(opt){
		case "all":
			AegisPostNew.find({}).sort({date:-1}).exec(function(err, postslist){
					//console.log(postslist);
					res.json(postslist);
			});
			break;
		case "latest":
			var count = req.params.index;
			AegisPostNew.find({}).sort({date:-1}).limit(count).exec(function(err, postslist){
					//console.log(postslist);
					res.json(postslist);
			});
			break;
		case "pages":

			var pages = req.params.index.split("-");
			AegisPostNew.find({}).sort({date:-1}).skip(pages[0]).limit(pages[1]-pages[0]).exec(function(err, postslist){

				res.json(postslist);
			});
			break;
		case "count":
			AegisPostNew.count({}, function(err, count){
				res.json(count);
			});
			break;
		default:
			AegisPostNew.findOne({_id:opt}).exec(function(err,postslist){
				res.json(postslist);
			});
			break;
	}
};

var newcancelpost = function(req, res){
	fs.exists(__dirname+"/posts/temp/", function(exists){
		if(exists){
			var t = fs.readdirSync(__dirname+"/posts/temp/");
			if(t.length >0){
				for(var i = 0; i<t.length;i++){
					fs.unlinkSync(__dirname+"/posts/temp/"+t[i]);
				}
			}
			res.send(202);
		}
		else{
			fs.mkdirSync(__dirname+"/posts/temp", 0777);
			res.send(204);
		}
	});
};
var newdelpost = function(req,res){
	console.log(req.params.pid);
	AegisPostNew.findOne({_id:req.params.pid}, function(err,postToDel){
	console.log(postToDel);
		console.log(__dirname+"/posts/"+postToDel.date.getFullYear()+"/"+(postToDel.date.getMonth()+1)+"/"+postToDel._id+"/");
		fs.exists(__dirname+"/posts/"+postToDel.date.getFullYear()+"/"+(postToDel.date.getMonth()+1)+"/"+postToDel._id+"/", function(exists){
		console.log(exists)
			if(exists){
				var readDir = fs.readdirSync(__dirname+"/posts/"+postToDel.date.getFullYear()+"/"+(postToDel.date.getMonth()+1)+"/"+postToDel._id+"/");
				for(var i =0; i<readDir.length;i++){
					console.log(readDir[i]);
					fs.unlinkSync(__dirname+"/posts/"+postToDel.date.getFullYear()+"/"+(postToDel.date.getMonth()+1)+"/"+postToDel._id+"/"+readDir[i]); //Delete Files associated with Post	
				}
				fs.rmdirSync(__dirname+"/posts/"+postToDel.date.getFullYear()+"/"+(postToDel.date.getMonth()+1)+"/"+postToDel._id);
				res.send(200);
			}
			else{
				console.log("No Files");
			}
			
		});
		AegisPostNew.remove({_id:req.params.pid},function(err,result){
			console.log("post Deleted");
		});
		res.send(200);
	});
};

app.post("/loginuser", userlogin);


app.get("/checkcookie", cookieCheck);


app.get("/platform/setup", checkforsetup);
app.post("/platform/setup", savesetup);

app.get("/platform/load/:resource", loadResouce);
app.post("/sendfileold", fileuploader);
app.post("/sendfile", fileup);
app.get("/hashd/:filename", hasHD);

app.get("/posts/:pid", getOnePost);
app.get("/postpublish/:pid", postPublish);
app.get("/publishedposts", publishedPosts);
app.get("/latestposts", getLatestPosts);
app.get("/posts", getPosts);
app.get("/blog", getBlogData);
app.post("/changeTheme", changeTheme);
app.post("/changeBlogName", changeBlogName);

app.get("/delpost/:pid", delPost);

app.post("/updatepost", updatepost);
app.post("/savepost", savepost);


app.post("/savepostb", newsavepost);
app.get("/getpostsb/:option/:index", newgetposts);
app.get("/cancelpostb", newcancelpost);
app.get("/delpostb/:pid", newdelpost);

app.get("/cancelpost", cancelpost);

app.post("/testSave", tester);

app.get("/", function(req,res){});


app.listen(8000);
console.log('Aegis Platform version 0.6');
