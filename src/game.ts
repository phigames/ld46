import 'phaser';
import { Bed } from './bed';
import { TrashCan } from './trashcan';
import { Doctor } from './doctor';
import { Patient } from './patient';
import { Organ } from './organ';
import { uglySettings, DOCTOR_SPAWN_INTERVAL, GAME_WIDTH, GAME_HEIGHT, PATIENT_SPAWN_INTERVAL, DARK_COLOR, FONT_FAMILY, GRINDER_APPEAR_TIME, INITIAL_ORGAN_NUMBER, PATIENT_MISSING_ORGAN_PROB } from './global';
import { Grinder } from './grinder';


class TitleScreen extends Phaser.Scene {

    constructor() {
        super('title');
    }

    preload() {
        this.load.image('titlescreen', 'assets/titlescreen.png');
    }

    create() {
        console.log('title');
        
        this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'titlescreen')
            .setInteractive()
            .on('pointerdown', () => this.scene.start('level'));
    }

}


class EndScreen extends Phaser.Scene {

    died: number;
    sacrificed: number;

    constructor() {
        super('end');
    }
    
    preload() {
        this.load.image('endscreen', 'assets/titlescreen.png');
    }

    create(data: object) {
        console.log('title');
        
        this.died = data['died'];
        this.sacrificed = data['sacrificed'];
        this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'endscreen')
            .setInteractive()
            .on('pointerdown', () => { /* TODO */ });
        this.add.text(50, 50, `${this.died}, ${this.sacrificed}`, { fontFamily: FONT_FAMILY, color: 0x28221f });
    }

}


class Level extends Phaser.Scene {

    beds: Bed[];
    selectedDoc: Doctor;
    selectedOrgan: Organ;
    private selectionMarker: Phaser.GameObjects.Rectangle;
    trashcanLeft: TrashCan;
    trashcanRight: TrashCan;
    grinder: Grinder;
    timeToSpawnDoctor: number;
    timeToSpawnPatient: number;
    hoursOnClock: number;
    minutesOnClock: number;
    clock: Phaser.GameObjects.Text;

    invalidSound: Phaser.Sound.BaseSound;
    selectSound: Phaser.Sound.BaseSound;
    popupSound: Phaser.Sound.BaseSound;
    backgroundSound: Phaser.Sound.BaseSound;

    constructor() {
        super('level');
        this.beds = [];
        this.selectedDoc = null;
        this.selectedOrgan = null;
        this.timeToSpawnDoctor = 500;
        this.timeToSpawnPatient = 0;
        this.hoursOnClock = 20;
        this.minutesOnClock = 0;
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
        this.loadImage('ghost');
        this.loadSpreadsheet('bed', 50, 50);
        this.loadSpreadsheet('doctor', 50, 50);

        this.loadAudio('background');
        this.loadAudio('invalid');
        this.loadAudio('select');
        this.loadAudio('popup');
        this.loadAudio('extract_organ');
        this.loadAudio('insert_organ');
        this.loadAudio('problem');
        this.loadAudio('beep');
        this.loadAudio('pit');
        this.loadAudio('grinder');
        this.loadAudio('endscreen');

        let progressText = this.add.text(GAME_WIDTH / 2 - 40, GAME_HEIGHT / 2 - 10, '0%', { fontFamily: FONT_FAMILY, color: DARK_COLOR });
        this.load.on('progress', (progress: number) => {
            progressText.text = `loading...${Math.round(progress * 100)}`;
        });
        this.load.on('complete', () => {
            progressText.destroy();
        });
    }

    create() {
        let background = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'background');
        background.depth = -10000;
        background.setInteractive();
        background.on('pointerdown', () => this.deselectAll());
        this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'pits_front').depth = 10000;
        this.clock = this.add.text(GAME_WIDTH - 40, 30, '', { fontFamily: FONT_FAMILY, color: '#dfb9ca', fontSize: '8px' });

        this.selectionMarker = this.add.rectangle(0, 0, 50, 50);
        this.selectionMarker.fillAlpha = 0;
        this.selectionMarker.setStrokeStyle(1, 0xd4eded);
        this.selectionMarker.depth = 10000;
        this.selectionMarker.visible = false;

        for (let i = 0; i < 7; i++) {
            let bed = new Bed(this, i, this.onOrganClick.bind(this));
            this.add.existing(bed);
            bed.on('pointerdown', () => this.onBedClick(bed));
            this.beds.push(bed);
        }
        this.spawnPatient(1);
        this.spawnOrgans(INITIAL_ORGAN_NUMBER);

        this.trashcanLeft = new TrashCan(this, 57, GAME_HEIGHT - 34);
        this.add.existing(this.trashcanLeft);
        this.trashcanLeft.on('pointerdown', () => this.onTrashcanClick(this.trashcanLeft));
        this.trashcanRight = new TrashCan(this, GAME_WIDTH - 58, GAME_HEIGHT - 34);
        this.add.existing(this.trashcanRight);
        this.trashcanRight.on('pointerdown', () => this.onTrashcanClick(this.trashcanRight));

        this.grinder = new Grinder(this, GAME_WIDTH / 2 - 50, GAME_HEIGHT - 50, this.onFreeOrganClick.bind(this));
        this.grinder.y += 200;
        this.grinder.back.y += 200;
        this.add.existing(this.grinder);
        this.tweens.add({
            targets: [ this.grinder, this.grinder.back ],
            y: GAME_HEIGHT - 50,
            duration: 1000,
            ease: 'Quad.Out',
            delay: GRINDER_APPEAR_TIME,
            onComplete: () => {
                this.hint(this.grinder.x - 100, this.grinder.y - 50, 'when organs run out, sacrifices must be made.', 5000);
            }
        });
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
        this.backgroundSound = this.sound.add('background');
        this.backgroundSound.play({
            loop: true
        })
    }

    update(time: number, delta: number) {
        this.timeToSpawnDoctor -= delta;
        if (this.timeToSpawnDoctor <= 0) {
            this.spawnDoctor();
            this.timeToSpawnDoctor = DOCTOR_SPAWN_INTERVAL;
        }

        this.timeToSpawnPatient -= delta;
        if (this.timeToSpawnPatient <= 0) {
            this.spawnPatient(PATIENT_MISSING_ORGAN_PROB);
            this.timeToSpawnPatient = PATIENT_SPAWN_INTERVAL;
        }

        this.minutesOnClock += delta / 1000 * 2;  // 2 minutes per second
        if (this.minutesOnClock >= 60) {
            this.hoursOnClock++;
            this.minutesOnClock -= 60;
            if (this.hoursOnClock > 24) {
                this.hoursOnClock -= 24;
            }
            if (this.hoursOnClock == 20) {
                // end of game
                this.scene.start('end', { died: uglySettings.stats.died, sacrificed: uglySettings.stats.sacrificed });
            }
        }
        this.clock.text = `${((this.hoursOnClock - 1) % 12 + 1).toString().padStart(2, '0')}:${(Math.floor(this.minutesOnClock / 15) * 15).toString().padStart(2, '0')} ${this.hoursOnClock == 24 || this.hoursOnClock < 12 ? 'am' : 'pm'}`;
    }

    private spawnDoctor() {
        let doc = new Doctor(this);
        doc.on('pointerdown', () => this.onDoctorClick(doc));
        this.add.existing(doc);
    }

    private spawnPatient(missingOrganProb: number) {
        let bedIndices = Phaser.Math.RND.shuffle([ 0, 1, 2, 3, 4, 5, 6 ]);
        for (let bedIndex of bedIndices) {
            let bed = this.beds[bedIndex];
            if (bed.patient === null) {
                bed.generatePatient(missingOrganProb);
                break;
            }
        }
    }

    private spawnOrgans(number: number) {
        for (let i = 0; i < number; i++) {
            let r = Math.random();
            let organ: Organ;
            if (r < 0.33) {
                organ = new Organ(this, 'cranium');
            } else if (r < 0.67) {
                organ = new Organ(this, 'liver');
            } else {
                organ = new Organ(this, 'nephro');
            }
            organ.x = Phaser.Math.Between(GAME_WIDTH / 2, GAME_WIDTH / 2 + 100);
            organ.y = Phaser.Math.Between(GAME_HEIGHT - 80, GAME_HEIGHT - 20);
            this.add.existing(organ);
            organ.on('pointerdown', () => this.onFreeOrganClick(organ));
        }
    }

    popup(message: string) {
        uglySettings.updatesPaused = true;
        let popup = this.add.rectangle(100, 100, 200, 100);
        popup.on('pointerdown', () => {
            uglySettings.updatesPaused = false;
            popup.off('pointerdown');
        });

    }

    hint(x: number, y: number, message: string, duration?: number) {
        if (duration === undefined) {
            duration = 1000;
        }
        let text = this.add.text(Math.round(x), Math.round(y), message, { fontFamily: FONT_FAMILY, color: DARK_COLOR, fontSize: '8px' });
        text.depth = 100000;
        this.tweens.add({
            targets: text,
            y: '-=10',
            alpha: 0,
            duration: 300,
            delay: duration,
            onComplete: () => {
                text.destroy();
            }
        });
    }

    private getClosestAvailableDoctor(x: number): Doctor {
        let closestDoctor = null;
        for (let child of this.children.getAll()) {
            if (child.name == 'doctor') {
                let doctor = <Doctor>child;
                if (doctor.isReadyToRemove() && (closestDoctor === null || Math.abs(doctor.x - x) < Math.abs(closestDoctor.x - x))) {
                    closestDoctor = doctor;
                }
            }
        }
        return closestDoctor;
    }

    private selectDoctor(doctor: Doctor) {
        if (this.selectedDoc !== null) {
            this.selectedDoc.setSelected(false);
        }
        this.selectedDoc = doctor;
        this.selectedDoc.setSelected(true);
        this.selectionMarker.displayWidth = Math.round(this.selectedDoc.width + 1);
        this.selectionMarker.displayHeight = Math.round(this.selectedDoc.height + 1);
        this.selectionMarker.x = Math.round(this.selectedDoc.x);
        this.selectionMarker.y = Math.round(this.selectedDoc.y);
        this.selectionMarker.visible = true;
        this.selectSound.play();
    }

    private selectOrgan(organ: Organ) {
        if (this.selectedOrgan !== null) {
            this.selectedOrgan.setSelected(false);
        }
        this.selectedOrgan = organ;
        this.selectedOrgan.setSelected(true);
        this.selectionMarker.displayWidth = Math.round(this.selectedOrgan.width + 2);
        this.selectionMarker.displayHeight = Math.round(this.selectedOrgan.height + 2);
        if (this.selectedOrgan.patient !== null) {
            this.selectionMarker.x = Math.round(this.selectedOrgan.patient.bed.x + this.selectedOrgan.x);
            this.selectionMarker.y = Math.round(this.selectedOrgan.patient.bed.y + this.selectedOrgan.y);
        } else {
            this.selectionMarker.x = Math.round(this.selectedOrgan.x);
            this.selectionMarker.y = Math.round(this.selectedOrgan.y);
        }
        this.selectionMarker.visible = true;
        this.selectSound.play();
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
        this.selectionMarker.visible = false;
    }

    onDoctorClick(doctor: Doctor) {
        if (uglySettings.updatesPaused) {
            return;
        }
        this.deselectAll();
        if (doctor.isReadyToInsert() || doctor.isReadyToRemove()) {
            this.hint(doctor.x + 5, doctor.y - doctor.height / 2, 'how may i help you?');
            this.selectDoctor(doctor);
        } else {
            this.hint(doctor.x + 5, doctor.y - doctor.height / 2, 'stop it, i am busy');
            this.invalidSound.play();
        }
    }

    onOrganClick(patient: Patient, organ: Organ) {
        if (uglySettings.updatesPaused) {
            return;
        }
        if (this.selectedDoc !== null && this.selectedOrgan === null) {
            if (this.selectedDoc.isReadyToRemove()) {
                this.selectedDoc.setRemoveTarget(patient, organ.getType());
                this.selectSound.play();
            }
            this.deselectAll();
        } else if (this.selectedDoc !== null && this.selectedOrgan !== null) {
            this.hint(patient.bed.x + organ.x + 8, patient.bed.y + organ.y + 5, 'can\'t put this here');
            this.invalidSound.play();
            this.deselectAll();
        } else {
            this.selectedDoc = this.getClosestAvailableDoctor(patient.bed.x + organ.x);
            if (this.selectedDoc !== null) {
                this.selectOrgan(organ);
                this.hint(this.selectionMarker.x + 8, this.selectionMarker.y + 5, 'where should this go?');
            } else {
                // no doctor available
                this.hint(patient.bed.x + organ.x + 8, patient.bed.y + organ.y + 5, 'all doctors are busy');
                this.invalidSound.play();
                this.deselectAll();
            }
        }
    }

    onBedClick(bed: Bed) {
        if (uglySettings.updatesPaused) {
            return;
        }
        if (this.selectedDoc !== null && this.selectedOrgan === null) {
            if (this.selectedDoc.isReadyToInsert()) {
                if (bed.canBeInserted(this.selectedDoc.organ)) {
                    this.selectedDoc.setTarget(bed.patient);
                    this.selectSound.play();
                } else {
                    this.hint(bed.x - 35, bed.y + 10, 'slot already taken');
                }
            } else {
                this.hint(bed.x - 42, bed.y + 10, 'grab an organ first');
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
            } else {
                this.hint(bed.x - 35, bed.y + 10, 'slot already taken');
                this.invalidSound.play();
            }
        } else {
            this.hint(bed.x - 55, bed.y + 10, 'select organ or doctor first');
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
                this.hint(this.selectionMarker.x + 8, this.selectionMarker.y + 5, 'that\'s not possible');
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
            this.hint(trashcan.x - 42, trashcan.y - 20, 'grab an organ first');
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
            this.deselectAll();
        } else {
            this.selectedDoc = this.getClosestAvailableDoctor(organ.x);
            if (this.selectedDoc !== null) {
                this.selectOrgan(organ);
                this.hint(this.selectionMarker.x + 8, this.selectionMarker.y + 5, 'where should this go?');
            } else {
                // no doctor available
                this.hint(organ.x + 8, organ.y + 5, 'all doctors are busy');
                this.invalidSound.play();
            }
        }
    }

}


const config = {
    type: Phaser.AUTO,
    backgroundColor: '#acc2c3',
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    pixelArt: true,
    zoom: 3,
    scene: [ TitleScreen, Level, EndScreen ]
};

const game = new Phaser.Game(config);
