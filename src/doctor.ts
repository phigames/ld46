import 'phaser';
import { Organ, OrganType } from './organ';
import { TrashCan } from './trashcan';
import { Patient } from './patient';
import { uglySettings, HOVER_OPACITY, DOCTOR_SPEED } from './global';
import { Grinder } from './grinder';
import { Level } from './game';


type MoveMode = 'start' | 'walk-to-x' | 'walk-to-y' | 'return';


export class Doctor extends Phaser.GameObjects.Container {

    static yLane = 200

    organ: Organ;
    private target: Patient | TrashCan | Grinder | Organ;
    private moveMode: MoveMode;
    private removeOrganType: OrganType;
    private centerLane: number;
    private startX: number;
    protected sprite: Phaser.GameObjects.Sprite
    private selected: boolean;
    private dead: boolean;
    teleporting: boolean;
    private nextTask;

    constructor(scene: Phaser.Scene) {
        super(scene);
        this.name = 'doctor';
        this.organ = null;
        this.target = null;
        this.moveMode = 'start';
        this.removeOrganType = null;
        this.centerLane = Phaser.Math.Between(130, 180);
        this.startX = Phaser.Math.Between(30, 100);
        this.selected = false;
        this.dead = false;
        this.nextTask = null;
        this.setX(-50);
        this.setY(this.centerLane);
        this.createSprite();
        this.setInteractive();

        this.scene.events.on('update', this.update.bind(this));
        this.on('pointerover', () => this.alpha = HOVER_OPACITY);
        this.on('pointerout', () => this.alpha = 1);
        this.on('destroy', () => {
            this.sprite.destroy();
            if (this.organ !== null) {
                this.organ.destroy();
            }
        });
    }

    protected createSprite() {
        this.sprite = this.scene.add.sprite(0, 0, 'doctor', 0);
        this.add(this.sprite);
        this.setSize(16, 50);
    }

    setSelected(selected: boolean) {
        this.selected = selected;
    }

    isReadyToRemove() {
        return this.moveMode === null && this.organ === null;
    }

    isReadyToInsert() {
        return this.moveMode === null && this.organ !== null;
    }

    setRemoveTarget(target: Patient, organType: OrganType) {
        this.target = target;
        this.moveMode = 'walk-to-x';
        this.removeOrganType = organType;
    }

    setTarget(target: Patient | TrashCan | Grinder | Organ) {
        this.target = target;
        this.moveMode = 'walk-to-x';
    }

    moveOrgan(source: Patient | Organ, organType: OrganType, target: Patient | TrashCan | Grinder) {
        if (source instanceof Patient) {
            this.setRemoveTarget(source, organType);
        } else {
            this.setTarget(source);
        }
        this.nextTask = () => this.setTarget(target);
    }

    private walkToStart(delta: number): boolean {
        if (this.x < this.startX) {
            this.x += delta * DOCTOR_SPEED;
        } else {
            this.x = this.startX;
            this.moveMode = null;
            return true;
        }
        return false;
    }

    private walkToTarget(delta: number): boolean {
        let reachedTarget = false;
        switch (this.moveMode) {
            case 'walk-to-x':
                if (this.x <= this.target.doctorPosition.x) {
                    // walk right
                    this.x += delta * DOCTOR_SPEED;
                    if (this.x >= this.target.doctorPosition.x) {
                        this.x = this.target.doctorPosition.x;
                        this.moveMode = 'walk-to-y';
                    }
                    this.sprite.flipX = false;
                } else if (this.x > this.target.doctorPosition.x) {
                    // walk left
                    this.x -= delta * DOCTOR_SPEED;
                    if (this.x <= this.target.doctorPosition.x) {
                        this.x = this.target.doctorPosition.x;
                        this.moveMode = 'walk-to-y';
                    }
                    this.sprite.flipX = true;
                }
                break;

            case 'walk-to-y':
                if (this.y <= this.target.doctorPosition.y) {
                    // walk down
                    this.y += delta * DOCTOR_SPEED;
                    if (this.y >= this.target.doctorPosition.y) {
                        this.y = this.target.doctorPosition.y;
                        this.moveMode = null;
                        reachedTarget = true;
                    }
                } else if (this.y > this.target.doctorPosition.y) {
                    // walk up
                    this.y -= delta * DOCTOR_SPEED;
                    if (this.y <= this.target.doctorPosition.y) {
                        this.y = this.target.doctorPosition.y;
                        this.moveMode = null;
                        reachedTarget = true;
                    }
                }
                this.sprite.flipX = false;
                break;
        }
        return reachedTarget;
    }

    private walkToCenter(delta: number) {
        let reachedCenter = false;
        if (this.y <= this.centerLane) {
            this.y += delta * DOCTOR_SPEED;
            if (this.y >= this.centerLane) {
                this.y = this.centerLane;
                this.moveMode = null;
                reachedCenter = true;
            }
        } else if (this.y > this.centerLane) {
            this.y -= delta * DOCTOR_SPEED;
            if (this.y <= this.centerLane) {
                this.y = this.centerLane;
                this.moveMode = null;
                reachedCenter = true;
            }
        }
        return reachedCenter;
    }

    private updateOrganPosition() {
        if (this.organ !== null) {
            if (this.sprite.flipX) {
                // looking left
                this.organ.x = -15;
                this.organ.y = -10;
            } else {
                // looking right
                this.organ.x = 15;
                this.organ.y = -10;
            }
        }
    }

    private updateAnimation() {
        if (this.teleporting) {
            this.sprite.anims.stop();
            this.sprite.setFrame(12);
        } else if (this.moveMode === 'start') {
            this.sprite.play('walk_without', true);
        } else if (this.moveMode === null && this.target instanceof Grinder) {
            this.sprite.anims.stop();
            this.sprite.setFrame(12);
        } else {
            let move = this.moveMode === null ? 'wait' : 'walk';
            let organ = this.organ === null ? 'without' : 'with';
            this.sprite.play(`${move}_${organ}`, true);
        }
    }

    update(time: number, delta: number) {
        if (uglySettings.updatesPaused) {
            return;
        }
        if (this.dead) {
            return;
        }
        if (this.moveMode == 'start') {
            this.walkToStart(delta);
        } else if (this.target !== null) {
            if (this.target instanceof Organ && this.target.pickedUp) {
                // free organ already has a new patient
                this.target = null;
                this.nextTask = null;
                this.moveMode = 'return';
            } else if (this.walkToTarget(delta)) {
                // arrived at target
                if (this.target instanceof Patient || this.target instanceof TrashCan) {
                    if (this.organ === null) {
                        if (this.target instanceof Patient) {
                            this.organ = this.target.popOrgan(this.removeOrganType);
                            if (this.organ !== null) {
                                // successful removal
                                this.add(this.organ);
                                this.organ.pickedUp = true;
                            } else {
                                // failed removal
                                this.nextTask = null;
                            }
                        } else if (this.target instanceof TrashCan) {
                            this.teleporting = true;
                            (<Level>this.scene).teleport(this, this.target);
                        }
                    } else if (this.organ !== null) {
                        if (this.target.setOrgan(this.organ)) {
                            // successful insertion
                            this.remove(this.organ);
                            this.organ.pickedUp = false;
                            this.organ = null;
                            this.nextTask = null;
                        } else {
                            // failed insertion
                            this.nextTask = null;
                        }
                    }
                    this.target = null;
                    this.moveMode = 'return';
                } else if (this.target instanceof Grinder) {
                    this.target.grind(this);
                    this.dead = true;
                } else if (this.target instanceof Organ) {
                    if (!this.target.pickedUp) {
                        // successful retrieval
                        this.organ = this.target;
                        this.add(this.organ);
                        this.organ.pickedUp = true;
                        this.organ.off('pointerdown');
                    } else {
                        // organ has already been taken
                        this.nextTask = null;
                    }
                    this.target = null;
                    this.moveMode = 'return';
                }
            }
        } else if (this.moveMode == 'return') {
            if (this.walkToCenter(delta)) {
                if (this.nextTask !== null) {
                    this.nextTask();
                }
            }
        }
        this.updateAnimation();
        this.updateOrganPosition();
        this.depth = this.y + this.height / 2;
    }

}
