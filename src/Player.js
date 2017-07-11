'use strict';

const Entity = require('./Entity');
const { Attribute, PlayerRank } = require('./Attributes');

const PLAYERITEMS = 16; // max num of items in a player's inventory

class Player extends Entity {

  constructor() {
    super();
    this.password = "UNDEFINED";
    this.rank = PlayerRank.REGULAR;

    this.connection = 0;
    this.loggedIn = false;
    this.active = false;
    this.newbie = true;

    this.experience = 0;
    this.level = 1;
    this.room = 1;
    this.money = 0;

    this.nextAttackTime = 0;

    this.baseAttributes = this._initAttributes();
    this.baseAttributes[Attribute.STRENGTH] = 1;
    this.baseAttributes[Attribute.HEALTH] = 1;
    this.baseAttributes[Attribute.AGILITY] = 1;

    this.attributes = this._initAttributes();

    this.inventory = [];
    this.items = 0;
    this.weapon = -1;
    this.armor = -1;

    this.statPoints = 18;
    this.recalculateStats();
    this.hitPoints = this.GetAttr(Attribute.MAXHITPOINTS);
  }

  _initAttributes() {
    const attrArray = [];
    Attribute.enums.forEach(attr => {
      attrArray[attr] = 0;
    });
    return attrArray;
  }

  needForLevel(level) {
    return Math.round(100 * (Math.pow(1.4, level - 1) - 1));
  }

  needForNextLevel() {
    return this.needForLevel(this.level + 1) - this.experience;
  }

  train() {
    if (this.needForNextLevel() <= 0) {
      this.statPoints += 2;
      this.baseAttributes[Attribute.MAXHITPOINTS] += this.level;
      this.level++;
      this.recalculateStats();
      return true;
    }
    return false;
  }

  recalculateStats() {
    this.attributes[Attribute.MAXHITPOINTS] =
        10 + parseInt(this.level * (this.GetAttr(Attribute.HEALTH) / 1.5));
    this.attributes[Attribute.HPREGEN] =
        (this.GetAttr(Attribute.HEALTH) / 5) + this.level;

    this.attributes[Attribute.ACCURACY] = this.GetAttr(Attribute.AGILITY) * 3;
    this.attributes[Attribute.DODGING] = this.GetAttr(Attribute.AGILITY ) * 3;
    this.attributes[Attribute.DAMAGEABSORB] = parseInt(this.GetAttr(Attribute.STRENGTH) / 5);
    this.attributes[Attribute.STRIKEDAMAGE] = parseInt(this.GetAttr(Attribute.STRENGTH) / 5);

    // make sure the hitpoints don't overflow if your max goes down
    if(this.hitpoints > this.GetAttr(Attribute.MAXHITPOINTS))
        this.hitpoints = this.GetAttr(Attribute.MAXHITPOINTS);

    if( this.Weapon() != 0 )
        this.addDynamicBonuses(this.Weapon());
    if( this.Armor() != 0 )
        this.addDynamicBonuses(this.Armor());
  }

  addBonuses(item) {
    if (item == 0) return;
    Attribute.enums.forEach(attr => {
      this.baseAttributes[attr] += item.attributes[attr];
    });
    this.recalculateStats();
  }

  addDynamicBonuses(item) {
    if (item == 0) return;
    Attribute.enums.forEach(attr => {
      this.attributes[attr] += item.attributes[attr];
    });
  }

  setBaseAttr(attr, val) {
    this.baseAttributes[attr] = val;
    this.recalculateStats();
  }

  addToBaseAttr(attr, val) {
    this.baseAttributes[attr] += val;
    this.recalculateStats();
  }

  addHitPoints(hitPoints) {
    this.setHitPoints(this.hitPoints + hitPoints);
  }

  setHitPoints(hitPoints) {
    this.hitPoints = hitPoints;

    if (this.hitPoints < 0) this.hitPoints = 0;
    if (this.hitPoints > this.GetAttr(Attribute.MAXHITPOINTS))
      this.hitPoints = this.GetAttr(Attribute.MAXHITPOINTS);
  }

  GetAttr(attr) {
    // calculate the base value plus the temporary calculated value:
    const val = this.attributes[attr] + this.baseAttributes[attr];

    if(attr == Attribute.STRENGTH || attr == Attribute.AGILITY
        || attr == Attribute.HEALTH){
        // return 1 if the value is less than 1
        if(val < 1) return 1;
    }

    return val;
  }

  Weapon() {
    if( this.weapon == -1 )                // if no weapon armed
        return 0;                       // return 0
    else
        return this.inventory[this.weapon];   // return item id
  }

  Armor() {
    if( this.armor == -1 )                 // if no armor armed
        return 0;                       // return 0
    else
        return this.inventory[this.armor];    // return item id
  }

  MaxItems() {
    return PLAYERITEMS;
  }

  pickUpItem(item) {
    if(this.items < this.MaxItems()) {
      this.inventory[this.items] = item;
      this.items++;
        return true;
    }
    return false;
  }

  dropItem(index) {
    if (this.inventory[index] !== 0) {

      if (this.weapon === index) {
        this.removeWeapon();
      }

      if(this.armor === index) {
        this.removeArmor();
      }

      this.inventory[index] = 0;
      this.items--;

      return true;
    }
    return false;
  }

  removeWeapon() {
    this.weapon = -1;
    this.recalculateStats();
  }

  removeArmor() {
    this.armor = -1;
    this.recalculateStats();
  }

  useWeapon(index) {
    this.removeWeapon();
    this.weapon = index;
    this.recalculateStats();
  }

  useArmor(index) {
    this.removeArmor();
    this.armor = index;
    this.recalculateStats();
  }

}

module.exports = Player;
