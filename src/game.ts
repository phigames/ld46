import 'phaser';
import { Bed } from './bed';
import { TrashCan } from './trashcan';
import { Doctor } from './doctor';
import { Patient } from './patient';
import { OrganType, Organ } from './organ';
import { uglySettings, DOCTOR_SPAWN_INTERVAL, GAME_WIDTH, GAME_HEIGHT, PATIENT_SPAWN_INTERVAL } from './global';
import { Grinder } from './grinder';


export class Level extends Phaser.Scene {

    beds: Bed[];
    selectedDoc: Doctor;
    selectedOrgan: Organ;
    trashcanLeft: TrashCan;
    trashcanRight: TrashCan;
    grinder: Grinder;
    timeToSpawnDoctor: number;
    timeToSpawnPatient: number;

    invalidSound: Phaser.Sound.BaseSound;
    selectSound: Phaser.Sound.BaseSound;
    popupSound: Phaser.Sound.BaseSound;

    constructor() {
        super('level');
        this.beds = [];
        this.selectedDoc = null;
        this.selectedOrgan = null;
        this.timeToSpawnDoctor = 1000;
        this.timeToSpawnPatient = 0;
    }

    loadImage(name: string) {
        this.load.image(name, `assets/${name}.png`);
    }

    loadSpreadsheet(name: string, frameWidth: number, frameHeight: number) {
        this.load.spritesheet(name, `assets/${name}.png`, { frameWidth: frameWidth, frameHeight: frameHeight });
    }

    loadAudio(name: string) {
        this.load.audio(name, `assets/${name}.ogg`);
    }

    preload() {
        this.loadImage('background');
        this.loadImage('infoboard');
        this.loadImage('organ_cranium');
        this.loadImage('organ_liver');
        this.loadImage('organ_nephro');
        this.loadImage('pit');
        this.loadImage('pits_front');
        this.loadImage('grinder_back');
        this.loadImage('grinder_front');
        this.loadSpreadsheet('bed', 50, 50);
        this.loadSpreadsheet('doctor', 50, 50);

        this.loadAudio('invalid');
        this.loadAudio('select');
        this.loadAudio('popup');
        this.loadAudio('extract_organ');
        this.loadAudio('problem');
        this.loadAudio('beep');
        this.loadAudio('pit');
        this.loadAudio('endscreen');
    }

    create() {
        this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'background').on('pointerdown', () => this.deselectAll());
        this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'pits_front').depth = 10000;

        for (let i = 0; i < 7; i++) {
            let bed = new Bed(this, i, this.onOrganClick.bind(this));
            this.add.existing(bed);
            bed.on('pointerdown', () => this.onBedClick(bed));
            this.beds.push(bed);
        }
        this.spawnPatient();

        this.trashcanLeft = new TrashCan(this, 60, GAME_HEIGHT - 35);
        this.add.existing(this.trashcanLeft);
        this.trashcanLeft.on('pointerdown', () => this.onTrashcanClick(this.trashcanLeft));
        this.trashcanRight = new TrashCan(this, GAME_WIDTH - 60, GAME_HEIGHT - 35);
        this.add.existing(this.trashcanRight);
        this.trashcanRight.on('pointerdown', () => this.onTrashcanClick(this.trashcanRight));

        this.grinder = new Grinder(this, GAME_WIDTH / 2, GAME_HEIGHT - 50, this.onFreeOrganClick.bind(this));
        this.add.existing(this.grinder);
        this.grinder.on('pointerdown', () => this.onGrinderClick(this.grinder));

        this.anims.create({
            key: 'wait_without',
            frames: [ { key: 'doctor', frame: 0 } ],
            frameRate: 20,
            repeat: -1
        });
        this.anims.create({
            key: 'walk_without',
            frames: this.anims.generateFrameNumbers('doctor', { start: 0, end: 11 }),
            frameRate: 20,
            repeat: -1
        });
        this.anims.create({
            key: 'wait_with',
            frames: [ { key: 'doctor', frame: 12 } ],
            frameRate: 20,
            repeat: -1
        });
        this.anims.create({
            key: 'walk_with',
            frames: this.anims.generateFrameNumbers('doctor', { start: 12, end: 23 }),
            frameRate: 20,
            repeat: -1
        });

        this.invalidSound = this.sound.add('invalid');
        this.selectSound = this.sound.add('select');
    }

    update(time: number, delta: number) {
        this.timeToSpawnDoctor -= delta;
        if (this.timeToSpawnDoctor <= 0) {
            this.spawnDoctor();
            this.timeToSpawnDoctor = DOCTOR_SPAWN_INTERVAL;
        }

        this.timeToSpawnPatient -= delta;
        if (this.timeToSpawnPatient <= 0) {
            this.spawnPatient();
            this.timeToSpawnPatient = PATIENT_SPAWN_INTERVAL;
        }
    }

    private spawnDoctor() {
        let doc = new Doctor(this);
        doc.on('pointerdown', () => this.onDoctorClick(doc));
        this.add.existing(doc);
    }

    private spawnPatient() {
        let bedIndices = [2, 5, 3, 0, 6, 1, 4];
        for (let bedIndex of bedIndices) {
            let bed = this.beds[bedIndex];
            if (bed.patient === null) {
                bed.generatePatient(0);
                break;
            }
        }
    }

    popup(message: string) {
        uglySettings.updatesPaused = true;
        let popup = this.add.rectangle(100, 100, 200, 100);
        console.log(message);
        popup.on('click', () => {
            uglySettings.updatesPaused = false;
            popup.off('click');
        });

    }

    private getAvailableDoctor(): Doctor {
        for (let child of this.children.getAll()) {
            if (child.name == 'doctor') {
                let doctor = <Doctor>child;
                if (doctor.isReadyToRemove()) {
                    return doctor;
                }
            }
        }
        return null;
    }

    private deselectAll() {
        if (this.selectedDoc !== null) {
            this.selectedDoc.setSelected(false);
            this.selectedDoc = null;
        }
        if (this.selectedOrgan !== null) {
            this.selectedOrgan.setSelected(false);
            this.selectedOrgan = null;
        }
    }

    onDoctorClick(doctor: Doctor) {
        if (uglySettings.updatesPaused) {
            return;
        }
        if (doctor.isReadyToInsert() || doctor.isReadyToRemove()) {
            if (this.selectedDoc !== null) {
                this.selectedDoc.setSelected(false);
            }
            this.selectedDoc = doctor;
            this.selectedDoc.setSelected(true);
            this.selectSound.play();
        } else {
            this.invalidSound.play();
        }
    }

    onOrganClick(patient: Patient, organ: Organ) {
        if (uglySettings.updatesPaused) {
            return;
        }
        if (this.selectedDoc !== null) {
            if (this.selectedDoc.isReadyToRemove()) {
                this.selectedDoc.setRemoveTarget(patient, organ.getType());
                this.selectSound.play();
            }
            this.selectedDoc.setSelected(false);
            this.selectedDoc = null;
        } else {
            this.selectedDoc = this.getAvailableDoctor();
            if (this.selectedDoc !== null) {
                if (this.selectedOrgan !== null) {
                    this.selectedOrgan.setSelected(false);
                }
                this.selectedOrgan = organ;
                this.selectedOrgan.setSelected(true);
                this.selectSound.play();
            } else {
                // no doctor available
                this.invalidSound.play();
            }
        }
    }

    onBedClick(bed: Bed) {
        if (uglySettings.updatesPaused) {
            return;
        }
        if (this.selectedDoc !== null && this.selectedOrgan === null) {
            if (this.selectedDoc.isReadyToInsert() && bed.canBeInserted(this.selectedDoc.organ)) {
                this.selectedDoc.setTarget(bed.patient);
                this.selectSound.play();
            } else {
                this.invalidSound.play();
            }
        } else if (this.selectedDoc !== null && this.selectedOrgan !== null) {
            if (bed.canBeInserted(this.selectedOrgan)) {
                if (this.selectedOrgan.patient !== null) {
                    // organ is attached to a patient, use patient as target
                    this.selectedDoc.moveOrgan(this.selectedOrgan.patient, this.selectedOrgan.getType(), bed.patient);
                } else {
                    // organ is free, use organ as target
                    this.selectedDoc.moveOrgan(this.selectedOrgan, this.selectedOrgan.getType(), bed.patient);
                }
            }
        } else {
            this.invalidSound.play();
        }
        this.deselectAll();
    }

    onTrashcanClick(trashcan: TrashCan) {
        if (uglySettings.updatesPaused) {
            return;
        }
        if (this.selectedDoc !== null && this.selectedOrgan === null) {
            if (this.selectedDoc.isReadyToInsert()) {
                this.selectedDoc.setTarget(trashcan);
                this.selectSound.play();
            } else {
                this.invalidSound.play();
            }
        } else if (this.selectedDoc !== null && this.selectedOrgan !== null) {
            if (this.selectedOrgan.patient !== null) {
                // organ is attached to a patient, use patient as target
                this.selectedDoc.moveOrgan(this.selectedOrgan.patient, this.selectedOrgan.getType(), trashcan);
            } else {
                // organ is free, use organ as target
                this.selectedDoc.moveOrgan(this.selectedOrgan, this.selectedOrgan.getType(), trashcan);
            }
            this.selectSound.play();
        } else {
            this.invalidSound.play();
        }
        this.deselectAll();
    }

    onGrinderClick(grinder: Grinder) {
        if (uglySettings.updatesPaused) {
            return;
        }
        if (this.selectedDoc !== null && this.selectedOrgan === null) {
            if (this.selectedDoc.isReadyToRemove() || this.selectedDoc.isReadyToInsert()) {
                this.selectedDoc.setTarget(grinder);
                this.selectSound.play();
            } else {
                this.invalidSound.play();
            }
        } else if (this.selectedDoc !== null && this.selectedOrgan !== null) {
            if (this.selectedOrgan.patient !== null) {
                // organ is attached to a patient, use patient as target
                this.selectedDoc.moveOrgan(this.selectedOrgan.patient, this.selectedOrgan.getType(), grinder);
            } else {
                // organ is free, use organ as target
                this.selectedDoc.moveOrgan(this.selectedOrgan, this.selectedOrgan.getType(), grinder);
            }
            this.selectSound.play();
        } else {
            this.invalidSound.play();
        }
        this.deselectAll();
    }

    onFreeOrganClick(organ: Organ) {
        if (uglySettings.updatesPaused) {
            return;
        }
        if (this.selectedDoc !== null) {
            if (this.selectedDoc.isReadyToRemove() && organ.patient === null) {
                this.selectedDoc.setTarget(organ);
                this.selectSound.play();
            } else {
                this.invalidSound.play();
            }
            this.selectedDoc.setSelected(false);
            this.selectedDoc = null;
        } else {
            this.selectedDoc = this.getAvailableDoctor();
            if (this.selectedDoc !== null) {
                if (this.selectedOrgan !== null) {
                    this.selectedOrgan.setSelected(false);
                }
                this.selectedOrgan = organ;
                this.selectedOrgan.setSelected(true);
                this.selectSound.play();
            } else {
                // no doctor available
                this.invalidSound.play();
            }
        }
    }

}


const config = {
    type: Phaser.AUTO,
    // backgroundColor: '#125555',
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    pixelArt: true,
    zoom: 3,
    scene: Level
};

const game = new Phaser.Game(config);
