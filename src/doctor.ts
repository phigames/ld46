import 'phaser';
import { Organ, OrganType } from './organ';
import { TrashCan } from './trashcan';
import { Patient } from './patient';
import { uglySettings, HOVER_OPACITY, SELECT_OPACITY } from './global';
import { Grinder } from './grinder';


const SPEED = 0.05;


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

    constructor(scene: Phaser.Scene) {
        super(scene);
        this.organ = null;
        this.target = null;
        this.moveMode = 'start';
        this.removeOrganType = null;
        this.centerLane = Phaser.Math.Between(130, 180);
        this.startX = Phaser.Math.Between(30, 100);
        this.selected = false;
        this.setX(-50);
        this.setY(this.centerLane);
        this.createSprite();
        this.setInteractive();

        this.scene.events.on('update', this.update.bind(this));
        this.on('pointerover', () => this.alpha = HOVER_OPACITY);
        this.on('pointerout', () => { if (!this.selected) this.alpha = 1; });
        this.on('destroy', () => {
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
        this.alpha = selected ? SELECT_OPACITY : 1;
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

    private walkToStart(delta: number): boolean {
        if (this.x < this.startX) {
            this.x += delta * SPEED;
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
                    this.x += delta * SPEED;
                    if (this.x >= this.target.doctorPosition.x) {
                        this.x = this.target.doctorPosition.x;
                        this.moveMode = 'walk-to-y';
                    }
                    this.sprite.flipX = false;
                } else if (this.x > this.target.doctorPosition.x) {
                    // walk left
                    this.x -= delta * SPEED;
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
                    this.y += delta * SPEED;
                    if (this.y >= this.target.doctorPosition.y) {
                        this.y = this.target.doctorPosition.y;
                        this.moveMode = null;
                        reachedTarget = true;
                    }
                } else if (this.y > this.target.doctorPosition.y) {
                    // walk up
                    this.y -= delta * SPEED;
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
            this.y += delta * SPEED;
            if (this.y >= this.centerLane) {
                this.y = this.centerLane;
                this.moveMode = null;
                reachedCenter = true;
            }
        } else if (this.y > this.centerLane) {
            this.y -= delta * SPEED;
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
        if (this.moveMode === 'start') {
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
        if (this.moveMode == 'start') {
            this.walkToStart(delta);
        } else if (this.target !== null) {
            if (this.walkToTarget(delta)) {
                // arrived at target
                if (this.target instanceof Patient || this.target instanceof TrashCan) {
                    if (this.organ === null) {
                        this.organ = this.target.popOrgan(this.removeOrganType);
                        if (this.organ !== null) {
                            this.add(this.organ);
                        }
                    } else if (this.organ !== null) {
                        if (this.target.setOrgan(this.organ)) {
                            this.remove(this.organ);
                            this.organ = null;
                        }
                    }
                    this.target = null;
                    this.moveMode = 'return';
                } else if (this.target instanceof Grinder) {
                    this.target.grind(this);
                } else if (this.target instanceof Organ) {
                    this.organ = this.target;
                    this.add(this.organ);
                }
            }
        } else if (this.moveMode == 'return') {
            this.walkToCenter(delta);
        }
        this.updateAnimation();
        this.updateOrganPosition();
        this.depth = this.y + this.height / 2;
    }

}
