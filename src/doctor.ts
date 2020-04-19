import 'phaser';
import { updatesPaused } from './game';
import { Organ, OrganType } from './organ';
import { TrashCan } from './trashcan';
import { Patient } from './patient';


type MoveMode = 'walk-to-x' | 'walk-to-y' | 'return';
type TaskMode = 'insert' | 'remove';


export class Doctor extends Phaser.GameObjects.Container {

    static yLane = 200

    organ: Organ;
    target: Patient | TrashCan;
    moveMode: MoveMode;
    removeOrganType: OrganType;
    centerLane: number;
    protected sprite: Phaser.GameObjects.Sprite
    private selected: boolean;

    constructor(scene: Phaser.Scene) {
        super(scene);
        this.organ = null;
        this.target = null;
        this.moveMode = null;
        this.removeOrganType = null;
        this.centerLane = Phaser.Math.Between(150, 200);
        this.selected = false;
        this.setX(25);
        this.setY(this.centerLane);
        this.createSprite();
        this.setInteractive();

        this.scene.events.on('update', this.update.bind(this));
        this.on('pointerover', () => this.alpha = 0.5);
        this.on('pointerout', () => { if (!this.selected) this.alpha = 1; });
    }

    protected createSprite() {
        this.sprite = this.scene.add.sprite(0, 0, 'doctor', 0);
        this.add(this.sprite);
        this.setSize(16, 50);
    }

    setSelected(selected: boolean) {
        this.selected = selected;
        this.alpha = selected ? 0.5 : 1;
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

    setInsertTarget(target: Patient | TrashCan) {
        this.target = target;
        this.moveMode = 'walk-to-x';
    }

    walkToTarget(delta: number): boolean {
        let reachedTarget = false;
        switch (this.moveMode) {
            case 'walk-to-x':
                if (this.x <= this.target.doctorPosition.x) {
                    // walk right
                    this.x += delta*0.05
                    if (this.x >= this.target.doctorPosition.x) {
                        this.x = this.target.doctorPosition.x;
                        this.moveMode = 'walk-to-y';
                    }
                    this.sprite.flipX = false;
                } else if (this.x > this.target.doctorPosition.x) {
                    // walk left
                    this.x -= delta*0.05;
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
                    this.y += delta*0.05;
                    if (this.y >= this.target.doctorPosition.y) {
                        this.y = this.target.doctorPosition.y;
                        this.moveMode = null;
                        reachedTarget = true;
                    }
                } else if (this.y > this.target.doctorPosition.y) {
                    // walk up
                    this.y -= delta*0.05;
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

    walkToCenter(delta: number) {
        let reachedCenter = false;
        if (this.y <= this.centerLane) {
            this.y += delta*0.05;
            if (this.y >= this.centerLane) {
                this.y = this.centerLane;
                this.moveMode = null;
                reachedCenter = true;
            }
        } else if (this.y > this.centerLane) {
            this.y -= delta*0.05;
            if (this.y <= this.centerLane) {
                this.y = this.centerLane;
                this.moveMode = null;
                reachedCenter = true;
            }
        }
        return reachedCenter;
    }

    walkToTrash(delta: number){
        if (this.y != this.centerLane) {
            this.y -= delta*0.05
        }
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
        let move = this.moveMode === null ? 'wait' : 'walk';
        let organ = this.organ === null ? 'without' : 'with';
        this.sprite.play(`${move}_${organ}`, true);
    }

    update(time: number, delta: number) {
        if (updatesPaused) {
            return;
        }
        if (this.target !== null) {
            if (this.walkToTarget(delta)) {
                // arrived at target
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
            }
            this.updateAnimation();
            this.updateOrganPosition();
        } else if (this.moveMode == 'return') {
            this.walkToCenter(delta);
            this.updateAnimation();
            this.updateOrganPosition();
        }
    }

}
