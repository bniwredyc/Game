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
    return new Vector(this.x + vector.x, this.y + vector.y);
  }

  times(number = 1){
    // значение переменных не меняется - лучше использовать const
    // а вообще здесь можно без создания переменных вообще обойтись и
    // написать всё в одну строчку  return new Vector...
    let x = this.x * number;
    let y = this.y * number;
    let myVector = new Vector(x,y);
    return myVector;
  }
}

class Actor{
  constructor(pos = new Vector(0,0), size = new Vector(1,1), speed = new Vector(0,0)){
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
    if(!(obj instanceof Actor)){
      throw new Error('Ошибка с аргументом!');
    }
    if(obj === this){
      return false;
    }

    return obj.left < this.right && obj.right > this.left && obj.top < this.bottom && obj.bottom > this.top;
   }
}

class Level{
  constructor(grid = [], actors = []){
    this.grid = grid.slice();
    this.actors = actors.slice();
    this.player = this.actors.find(actor => actor.type === 'player');
    this.status = null;
    this.finishDelay = 1;
    this.height = this.grid.length;
    this.width = Math.max(...this.grid.map(line => line.length), 0);
  }

  isFinished(){
    return this.status !== null && this.finishDelay < 0;
  }

  actorAt(actor){
    if(!actor instanceof Actor){
      throw new Error('Передан некорректный объект!');
    }
    // скобки вокруг el можно опустить
    return this.actors.find((el) => el.isIntersect(actor));
  }

  obstacleAt(vect, size){
    if(!(vect instanceof Vector) || !(size instanceof Vector)){
      throw new Error('Передан не Vector!');
    }

    // const!
    let left = Math.floor(vect.x);
    let right = Math.ceil(vect.x + size.x);
    let top = Math.floor(vect.y);
    let bottom = Math.ceil(vect.y + size.y);

    if((left < 0) || (right > this.width) || (top < 0)){
      return 'wall';
    }

    if(bottom > this.height){
      return 'lava';
    }

    for(let x = left; x < right; x++){
      for(let y = top; y < bottom; y++){
        // здесь достаточно проверить, что ячейка не пустая,
        // в ней можент быть wall, lava или undefined
        // this.grid[y][x] можно сохранить в переменной
        if ( (this.grid[y][x] === 'wall') || (this.grid[y][x] === 'lava') ) {
          return this.grid[y][x];
        }
      }
    }
  }

  removeActor(actor){
    // проверка на undefined лишняя
    if(!(actor instanceof Actor) || actor === undefined){
      return;
    }
    let act = this.actors.indexOf(actor);
    if(act !== -1){
    	this.actors.splice(act, 1);
    }
  }

  noMoreActors(type){
    // == лучше заменить на ===, внешние скобки можно опустить
    return !(this.actors.some(actor => actor.type == type));
  }

  playerTouched(type, actor){
    if(this.status !== null){
      return;
    }
    if(type === 'lava' || type === 'fireball'){
      this.status = 'lost';
      return;
    }
    if(type === 'coin' && actor.type === 'coin'){
      this.removeActor(actor);
      if(this.noMoreActors('coin')){
        this.status = 'won';
      }
    }
  }
}

class LevelParser{
	constructor(dict){
	  // тут можно не обявлять переменную, а сразу присвоить значение поля
    let copyObj = Object.assign({}, dict);
    this.dict = copyObj;
  }

	actorFromSymbol(symbol){
	  // можно добавить значение по-умолчанию аргументу в конструкторе и убрать эту проверку
    if(this.dict) {
     	return this.dict[symbol];
    }
	}

	obstacleFromSymbol(symbol){
	  // ===
    if(symbol == 'x'){
     	return 'wall';
    }else if(symbol == '!'){
     	return 'lava';
    }
  }

  // можно добавить пустой массив в качестве значения по-умолчанию
	createGrid(array){
    return array.map(string => {
      // обычно строки преобразуюутся в массив с помощью метода split
  		return [...string].map(el => this.obstacleFromSymbol(el));
	 });
	}

	createActors(array){
		return array.reduce((prev, string, Y) => {
      // обычно строки преобразуюутся в массив с помощью метода split
			[...string].forEach((symb, X) => {
			  // эта проверка лишняя
				if(symb) {
				  // crt - плохое название переменной, непонятно, что в ней хранится
					let crt = this.actorFromSymbol(symb);
					if(typeof crt === "function") {
					  // const
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
    constructor(pos = new Vector(0,0), speed = new Vector(0,0), size = new Vector(1,1)){
      super(pos, size, speed);
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
  // можно добавить значение по-умолчанию
	constructor(pos){
		let speed = new Vector(0,2);
		super(pos, speed);
	}
}

class FireRain extends Fireball{
  // можно добавить значение по-умолчанию
	constructor(pos){
	  // const
    let speed = new Vector(0,3);
    super(pos, speed);
    this.start = pos;
	}

	handleObstacle(){
		this.pos = this.start;
	}
}

class Coin extends Actor{
	constructor(pos = new Vector(0,0)){
	  // лучше не менять значения аргументов. В super можно передать pos.plus...
		pos = pos.plus(new Vector(0.2, 0.1));
		// const
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
	constructor(pos = new Vector(0,0)){
	  // лучше не менять значения аргументов
    pos = pos.plus(new Vector(0, -0.5));
    let size = new Vector(0.8, 1.5);
    let speed = new Vector(0,0);
    super(pos, size, speed);
	}

	get type(){
		return 'player';
	}
}

const actorDict = {
  '@': Player,
  'v': FireRain,
  '=': HorizontalFireball,
  '|': VerticalFireball,
  'o': Coin
} // точка с запятой :)
const parser = new LevelParser(actorDict);
loadLevels()
          .then(schema => runGame(JSON.parse(schema), parser, DOMDisplay)
                                .then(() => alert('Вы выиграли приз!')));
