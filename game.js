'use strict';
class Vector{
  constructor(x = 0, y = 0){
    this.x = x;
    this.y = y;
  }

  plus(vector){
    if(!(vector instanceof Vector)){
      throw new Error('Можно прибавлять к вектору только вектор типа Vector');
    }
    let x = this.x + vector.x;
    let y = this.y + vector.y;
    let newVector = new Vector(x,y);
    return newVector;
  }

  times(number){
    let x = this.x * number;
    let y = this.y * number;
    let myVector = new Vector(x,y);
    return myVector;
  }
}

class Actor{
  constructor(pos, size, speed){
    if(!pos){
      pos = new Vector(0,0);
    }
    if(!size){
     size = new Vector(1,1);
    }
    if(!speed){
      speed = new Vector(0,0);
    }
    if(!(pos instanceof Vector)){
      throw new Error('Передан не объект типа Vector');
    }
    if(!(size instanceof Vector)){
      throw new Error('Передан не объект типа Vector');
    }
    if(!(speed instanceof Vector)){
      throw new Error('Передан не объект типа Vector');
    }
    this.pos = pos;
    this.size = size;
    this.speed = speed;
  }

  act(){

  }

  get left(){
    return this.pos.x;
  }

  get top(){
    return this.pos.y;
  }

  get right(){
    return this.pos.x + this.size.x;
  }

  get bottom(){
    return this.pos.y + this.size.y;
  }

  get type(){
    return 'actor';
  }

  isIntersect(obj){
    if(!(obj instanceof Actor) || !obj){
      throw new Error('Ошибка с аргументом!');
    }
    if(obj === this){
      return false;
    }
    if(obj.left < this.right && obj.right > this.left && obj.top < this.bottom && obj.bottom > this.top){
      return true;
    }else{
       return false;
    }
  }
}

class Level{
  constructor(grid = [], actors = []){
    this.grid = grid;
    this.actors = actors;
    this.player = this.actors.find(actor => actor.type === 'player');
    this.status = null;
    this.finishDelay = 1;
  }

  get height(){
    return this.grid.length;
  }

  get width(){
     return this.grid.reduce(function(prev, ar) {
			return ar.length > prev ? ar.length : prev;
		}, 0);
  }

  isFinished(){
    if(this.status !== null && this.finishDelay < 0){
      return true;
    }else{
      return false;
    }
  }

  actorAt(actor){
    if(!(actor instanceof Actor) || actor === undefined){
      throw new Error('Передан некорректный объект!');
    }
    return this.actors.find((el) => el.isIntersect(actor));
  }

  obstacleAt(vect, size){
    if(!(vect instanceof Vector) || !(size instanceof Vector)){
      throw new Error('Передан не Vector!');
    }
    let left = Math.ceil(vect.x);
    let right = Math.ceil(vect.x + size.x);
    let top = Math.ceil(vect.y);
    let bottom = Math.ceil(vect.y + size.y);

    if((left < 0) || (right > this.width) || (top < 0)){
      return 'wall';
    }

    if(bottom > this.height){
      return 'lava';
    }

    for(let x = left; x < right; x++){
      for(let y = top; y < bottom; y++){
        if((this.grid[y][x] === 'wall') || this.grid[y][x] === 'lava'){
          return this.grid[y][x];
        }
      }
    }
  }

  removeActor(actor){
    if(!(actor instanceof Actor) || actor === undefined){
      return;
    }
    let act = this.actors.indexOf(actor);
    if(act !== -1){
    	this.actors.splice(act, 1);
    }
  }

  noMoreActors(type){
  	for(let actor of this.actors){
      if(actor.type == type){
        return false;
      }
    }
    return true;
  }

  playerTouched(type, actor){
    if(this.status !== null){
      return;
    }
    if(type == 'lava' || type == 'fireball'){
      this.status = 'lost';
      return;
    }
    if(type == 'coin' && actor.type == 'coin'){
      this.removeActor(actor);
      if(this.noMoreActors('coin')){
     	this.status = 'won';
      	return;
      }
      return;
    }
  }
}

class LevelParser{

	constructor(dictin){
        this.dictin = dictin;
	}

	actorFromSymbol(symbol){
        if(this.dictin && symbol) {
        	return this.dictin[symbol];
        }
	}

	obstacleFromSymbol(symbol){
        if(symbol == 'x'){
        	return 'wall';
        }else if(symbol == '!'){
        	return 'lava';
        }else{
        	return undefined;
        }
	}

	createGrid(array){
       let ar = {
       	'x' : 'wall',
       	'!' : 'lava'
       }
       return array.map(function(string) {
			return [...string].map(el => ar[el]);
		});
	}

	createActors(array){
		let self = this;
		return array.reduce(function(prev, string, Y) {
			[...string].forEach(function(symb, X) {
				if(symb) {
					let crt = self.actorFromSymbol(symb);
					if(typeof crt === "function") {
						let pos = new Vector(X, Y);
						let checkedActor = new crt(pos);
						if(checkedActor instanceof Actor) {
							prev.push(checkedActor);
						}
					}
				}
			});
			return prev;
		}, []);
	}

	parse(array){
       return new Level(this.createGrid(array), this.createActors(array));
	}
}

class Fireball extends Actor{
    constructor(pos, speed){
       super();
       if(!pos){
       	pos = new Vector(0,0);
       }
       if(!speed){
       	speed = new Vector(0,0);
       }
       this.pos = pos;
       this.speed = speed;
       this.size = new Vector(1,1);
    }

    get type(){
    	return 'fireball';
    }

    getNextPosition(time = 1){
        return this.pos.plus(this.speed.times(time));
    }

    handleObstacle(){
    	this.speed = this.speed.times(-1);
    }

    act(time, field){
       let nextPosit = this.getNextPosition(time);
        if(field.obstacleAt(nextPosit, this.size)){
            this.handleObstacle();
        }else{
        	this.pos = nextPosit;
        }
    }
}

class HorizontalFireball extends Fireball{
	constructor(pos){
        let speed = new Vector(2,0);
        super(pos, speed);
	}
}

class VerticalFireball extends Fireball{
	constructor(pos){
		let speed = new Vector(0,2);
		super(pos, speed);
	}
}

class FireRain extends Fireball{
	constructor(pos){
       let speed = new Vector(0,3);
       super(pos, speed);
       this.start = pos;
	}

	handleObstacle(){
		this.pos = this.start;
	}
}

class Coin extends Actor{
	constructor(pos){
		if(!pos){
			pos = new Vector(0,0);
		}
		pos = pos.plus(new Vector(0.2, 0.1));
		let size = new Vector(0.6, 0.6);
		super(pos, size);

		this.springSpeed = 8;
		this.springDist = 0.07;
		this.spring = Math.random() * 2 * Math.PI;
		this.start = pos;
	}

	get type(){
		return 'coin';
	}

	updateSpring(time = 1){
        this.spring += this.springSpeed * time;
	}

	getSpringVector(){
		return new Vector(0, Math.sin(this.spring) * this.springDist);
	}

	getNextPosition(time = 1){
		this.updateSpring(time);
        return this.start.plus(this.getSpringVector());
	}

	act(time){
       this.pos = this.getNextPosition(time);
	}
}

class Player extends Actor{
	constructor(pos){
		if(!pos){
			pos = new Vector(0,0);
		}
      pos = pos.plus(new Vector(0, -0.5));
      let size = new Vector(0.8, 1.5);
      let speed = new Vector(0,0);
      super(pos, size, speed);
	}

	get type(){
		return 'player';
	}
}

// const grid = [
//   new Array(3),
//   ['wall', 'wall', 'lava']
// ];
// const level = new Level(grid);
// runLevel(level, DOMDisplay);

// const schema = [
//   '         ',
//   '         ',
//   '         ',
//   '         ',
//   '     !xxx',
//   '         ',
//   'xxx!     ',
//   '         '
// ];
// const parser = new LevelParser();
// const level = parser.parse(schema);
// runLevel(level, DOMDisplay);

// const schema = [
//   '         ',
//   '         ',
//   '         ',
//   '         ',
//   '     !xxx',
//   ' @       ',
//   'xxx!     ',
//   '         '
// ];
// const actorDict = {
//   '@': Player
// }
// const parser = new LevelParser(actorDict);
// const level = parser.parse(schema);
// runLevel(level, DOMDisplay);

// const schema = [
//   '         ',
//   '         ',
//   '    =    ',
//   '         ',
//   '     !xxx',
//   ' @       ',
//   'xxx!     ',
//   '         '
// ];
// const actorDict = {
//   '@': Player,
//   '=': HorizontalFireball
// }
// const parser = new LevelParser(actorDict);
// const level = parser.parse(schema);
// DOMDisplay(document.body, level);

// const schemas = [
//   [
//     '         ',
//     '         ',
//     '    =    ',
//     '       o ',
//     '     !xxx',
//     ' @       ',
//     'xxx!     ',
//     '         '
//   ],
//   [
//     '      v  ',
//     '    v    ',
//     '  v      ',
//     '        o',
//     '        x',
//     '@   x    ',
//     'x        ',
//     '         '
//   ]
// ];
// const actorDict = {
//   '@': Player,
//   'v': FireRain
// }
// const parser = new LevelParser(actorDict);
// runGame(schemas, parser, DOMDisplay)
//   .then(() => console.log('Вы выиграли приз!'));

const schema = [
  '         ',
  '         ',
  '    =    ',
  '       o ',
  '     !xxx',
  ' @       ',
  'xxx!     ',
  '         '
];
const actorDict = {
  '@': Player,
  '=': HorizontalFireball
}
const parser = new LevelParser(actorDict);
const level = parser.parse(schema);
runLevel(level, DOMDisplay)
  .then(status => console.log(`Игрок ${status}`));

// const schemas = [
//   [
//     '         ',
//     '         ',
//     '    =    ',
//     '       o ',
//     '     !xxx',
//     ' @       ',
//     'xxx!     ',
//     '         '
//   ],
//   [
//     '      v  ',
//     '    v    ',
//     '  v      ',
//     '        o',
//     '        x',
//     '@   x    ',
//     'x        ',
//     '         '
//   ]
// ];
// const actorDict = {
//   '@': Player,
//   'v': FireRain
// }
// const parser = new LevelParser(actorDict);
// runGame(schemas, parser, DOMDisplay)
//   .then(() => console.log('Вы выиграли приз!'));