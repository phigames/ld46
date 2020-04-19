import 'phaser';
import { Organ } from './organ';
import { TrashCan } from './trashcan';
import { Patient } from './patient';


interface Task {
    operation: string;
    organ: string
}


export class Doctor extends Phaser.GameObjects.Container {

    static yLane = 200

    organ: Organ;
    target: Patient | TrashCan;
    attarget: boolean;
    task: Task;
    centerLane: number;
    protected sprite: Phaser.GameObjects.Sprite

    constructor(scene: Phaser.Scene) {
        super(scene);
        this.organ = null;
        this.target = null;
        this.attarget = false;
        this.task = {operation: null, organ: null};
        this.centerLane = Phaser.Math.Between(200, 250);
        this.setX(25);
        this.setY(this.centerLane);
        this.createSprite();
        this.setInteractive();

        this.scene.events.on('update', this.update.bind(this));
    }

    protected createSprite() {
        this.sprite = this.scene.add.sprite(0, 0, 'doctor_frames', 0);
        this.add(this.sprite);
        this.scene.anims.play('walk_without', this);
        let infoField = this.scene.add.image(0, -50, 'organ_cranium');
        this.add(infoField);
        this.setSize(50, 50);
        this.sprite.anims.play
    }

    protected addOrgansprite() {
        let organ
    }

    setTarget(target: Patient | TrashCan) {
        this.target = target;
    }

    setTask(operation: string, organ: string) {
        this.task[operation] = operation;
        this.task[organ] = organ;
    }

    private setOrgan(organ: Organ) {
        this.organ = organ
    }

    walkToTarget(delta: number) {
        if (this.x < this.target.doctorPosition.x) {
            this.x += delta*0.05
        } else if (this.x > this.target.doctorPosition.x) {
            this.x -= delta*0.05;
        } else {
            if(this.y < this.target.doctorPosition.y) {
                this.y += delta*0.05;
            } else if (this.y > this.target.doctorPosition.y) {
                this.y -= delta*0.05;
            } else {
                this.attarget = true;
            }
        }
    }

    walkToCenter(delta: number) {
        if (this.y < this.centerLane) {
            this.y += delta*0.05;
        } else if (this.y > this.centerLane) {
            this.y -= delta*0.05;
        }
    }

    walkToTrash(delta: number){
        if (this.y != this.centerLane) {
            this.y -= delta*0.05
        }
    }

    update(time: number, delta: number) {
        this.sprite.play('walk_with', true);
        this.sprite.flipX = true;
        if (this.y > this.centerLane) {
            this.y = this.centerLane; // go back to your lane man!
        }
        if (this.target !== null && this.attarget === false) {
            this.walkToTarget(delta);
        } else if (this.attarget === true) {
            if (this.task.operation == 'remove') {
                this.organ = this.target.popOrgan(this.task.organ);
                this.walkToCenter(delta);
            } else if (this.task.operation == "insert") {
                this.target.setOrgan(this.organ) && this.setOrgan(null);
                this.walkToCenter(delta);
            } 
        }
    }

}
