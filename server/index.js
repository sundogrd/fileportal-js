// 用于简单的测试文件上传
// app.js
const koa = require('koa');
const app = new koa();
const koaBody = require('koa-body');
const Router = require('koa-router');
const fs = require('fs');
const router = new Router();
const path = require('path');
const port = 8899;
app.use(koaBody({
    multipart: true,
    formidable: {
		hash: 'md5',
		uploadDir: path.resolve(__dirname, './temp'),
		maxFileSize: 200*1024*1024,	// 设置上传文件大小最大限制，默认2M,这里200M
		onFileBegin:(name,file) => {
			console.log(file.type);
			console.log('\n')
		},
		onError:(err)=>{
			console.log(err);
		}
    }
}));

let allowCrossDomain = function(ctx, next) {
	ctx.set('Access-Control-Allow-Origin','*')
	ctx.set('Access-Control-Allow-Methods','GET,PUT,POST,DELETE')
    next();
}
app.use(allowCrossDomain);


router.post('/upload', async (ctx) => {
	// console.log(ctx.request);
	console.log(ctx.request.body)
	console.log(ctx.request.files);
	const file = ctx.request.files.file;	// 获取上传文件
	// console.log(file)
	const reader = fs.createReadStream(file.path);	// 创建可读流
	const ext = file.name.split('.').pop();		// 获取上传文件扩展名
	// console.log(ext)
	const upStream = fs.createWriteStream(path.resolve(__dirname, `./upload/${Math.random().toString()}.${ext}`));		// 创建可写流
	reader.pipe(upStream);	// 可读流通过管道写入可写流
	return ctx.body = '上传成功';
})

app.use(router.routes()).use(router.allowedMethods())

app.listen(port, ()=>{
    console.log(`koa is listening in ${port}`);
})
