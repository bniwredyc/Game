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
    delete this.actors[act];
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

