import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Button, StyleSheet, Text, View } from 'react-native';
import * as SQLite from 'expo-sqlite';
import Face from '../app/face';

const petDB = SQLite.openDatabase('digiPetDB.db');

// Constants for thresholds and adjustments
const MAX_LEVEL = 100;
const MIN_LEVEL = 0;
const HUNGER_INCREMENT = 10;
const THIRST_INCREMENT = 10;
const ENERGY_DECREMENT = 5;
const PLAY_ENERGY_CONSUMPTION = 20;
const REST_ENERGY_RECOVERY = 20;

export default function App() {
    const [currentFace, setCurrentFace] = useState(4);
    const [hunger, setHunger] = useState(MAX_LEVEL / 2);
    const [energy, setEnergy] = useState(MAX_LEVEL / 2);
    const [thirst, setThirst] = useState(MAX_LEVEL / 2);
    const [timerInterval, setTimerInterval] = useState(10000000); // Initial timer interval

    // Create table if not exists
    useEffect(() => {
        petDB.transaction(tx => {
            tx.executeSql(
                'CREATE TABLE IF NOT EXISTS pet_stats (id INTEGER PRIMARY KEY AUTOINCREMENT, hunger INT, thirst INT, energy INT);'
            );
        });
    }, []);

    // Load pet's stats from database on app start
    useEffect(() => {
        petDB.transaction(tx => {
            tx.executeSql(
                'SELECT * FROM pet_stats WHERE id = 1;',
                [],
                (_, { rows }) => {
                    const petStats = rows.item(0);
                    setHunger(petStats.hunger);
                    setThirst(petStats.thirst);
                    setEnergy(petStats.energy);
                }
            );
        });
    }, []);

    // Save pet's stats to database whenever they change
    useEffect(() => {
        petDB.transaction(tx => {
            tx.executeSql(
                'UPDATE pet_stats SET hunger = ?, thirst = ?, energy = ? WHERE id = 1;',
                [hunger, thirst, energy]
            );
        });
    }, [hunger, thirst, energy]);

    // Function to update the face based on stats
    useEffect(() => {
        let faceIndex = 4; // Default happy face

        // Check overall well-being and adjust the face accordingly
        switch (true) {
            case (hunger <= 10 && thirst <= 10 && energy >= 90):
                faceIndex = 0; // Happy face
                break;
            case (hunger >= 30 && thirst >= 30 && energy >= 70):
                faceIndex = 1; // Okay face
                break;
            case (hunger >= 50 && thirst >= 50 && energy >= 50):
                faceIndex = 2; // Meh face
                break;
            case (hunger >= 70 && thirst >= 70 && energy >= 30):
                faceIndex = 3; // Angry face
                break;
            case (hunger >= 90 && thirst >= 90 && energy >= 20):
                faceIndex = 4; // Sad face
                break;
            case (hunger == 100 && thirst == 100 && energy == 0):
                faceIndex = 5; // Dead face
                break;
            case (hunger == 0 && thirst == 0 && energy == 0):
                faceIndex = 6; // Sleepy face
                break;
            default:
                faceIndex = 2; // Default happy face
        }

        setCurrentFace(faceIndex);
    }, [hunger, thirst, energy]);


    // Function to decrease hunger, thirst, and energy over time
    useEffect(() => {
        const timer = setTimeout(() => {
            setHunger((hunger) => Math.min(MAX_LEVEL, hunger + HUNGER_INCREMENT));
            setThirst((thirst) => Math.min(MAX_LEVEL, thirst + THIRST_INCREMENT));
            setEnergy((energy) => Math.max(MIN_LEVEL, energy - ENERGY_DECREMENT));
        }, timerInterval); // Use the customizable timer interval
        return () => clearTimeout(timer);
    }, [hunger, thirst, energy, timerInterval]); // Include timerInterval in dependencies


    const feedPet = () => {
        if (hunger > MIN_LEVEL) {
            setHunger((hunger) => Math.max(MIN_LEVEL, hunger - HUNGER_INCREMENT));
        }
    };

    const playWithPet = () => {
        if (energy >= PLAY_ENERGY_CONSUMPTION) {
            setEnergy((energy) => Math.max(MIN_LEVEL, energy - PLAY_ENERGY_CONSUMPTION));
        }
    };

    const giveWater = () => {
        if (thirst > MIN_LEVEL) {
            setThirst((thirst) => Math.max(MIN_LEVEL, thirst - THIRST_INCREMENT));
        }
    };

    const restPet = () => {
        if (energy < MAX_LEVEL) {
            setEnergy((energy) => Math.min(MAX_LEVEL, energy + REST_ENERGY_RECOVERY));
        }
    };

    return (
        <View style={styles.container}>
            <Text>This is my Tamagotchi Pet</Text>
            <Face whichFace={currentFace} />
            <Text>Hunger Level: {hunger}</Text>
            <Text>Thirst Level: {thirst}</Text>
            <Text>Energy Level: {energy}</Text>
            <View style={styles.buttonContainer}>
                <Button title="Feed" onPress={feedPet} />
                <Button title="Give Water" onPress={giveWater} />
                <Button title="Rest" onPress={restPet} />
                <Button title="Play" onPress={playWithPet} />
            </View>
            <StatusBar style="auto" />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '50%',
        marginTop: 20,
    },
});
