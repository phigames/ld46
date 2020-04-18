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

    constructor(scene: Phaser.Scene) {
        super(scene);
        this.organ = null;
        this.target = null;
        this.attarget = false;
        this.task = {operation: null, organ: null}
        this.centerLane = Phaser.Math.Between(200, 250)
        this.setX(25);
        this.setY(this.centerLane);

        this.scene.events.on('update', this.update.bind(this));
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
