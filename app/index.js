import React, { useState, useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { ImageBackground, StyleSheet, Text, View, Animated, PanResponder, TouchableOpacity } from 'react-native';
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
//const REST_ENERGY_RECOVERY = 20;

export default function App() {
    const [currentFace, setCurrentFace] = useState(4);
    const [hunger, setHunger] = useState(MAX_LEVEL / 2);
    const [energy, setEnergy] = useState(MAX_LEVEL / 2);
    const [thirst, setThirst] = useState(MAX_LEVEL / 2);
    const [timerInterval, setTimerInterval] = useState(10000); // Initial timer interval
    const [isSleeping, setIsSleeping] = useState(false); // Track if the pet is sleeping

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
        if (isSleeping) return;
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
    }, [hunger, thirst, energy, isSleeping]);

    // Function to decrease hunger, thirst, and energy over time
    useEffect(() => {
        const timer = setTimeout(() => {
            setHunger((hunger) => Math.min(MAX_LEVEL, hunger + HUNGER_INCREMENT));
            setThirst((thirst) => Math.min(MAX_LEVEL, thirst + THIRST_INCREMENT));
            setEnergy((energy) => Math.max(MIN_LEVEL, energy - ENERGY_DECREMENT));
        }, timerInterval); // Use the customizable timer interval
        return () => clearTimeout(timer);
    }, [hunger, thirst, energy, timerInterval]); // Include timerInterval in dependencies

    // Effect to handle energy increase when the pet is sleeping
    useEffect(() => {
        if (isSleeping && energy < MAX_LEVEL) {
            const interval = setInterval(() => {
                setEnergy((prevEnergy) => Math.min(MAX_LEVEL, prevEnergy + 1)); // Increase energy level
            }, 1000); // Increase energy every second
            return () => clearInterval(interval); // Cleanup function to clear the interval
        }
    }, [isSleeping, energy]);

    // Function to make the pet sleep and increase energy levels
    const makePetSleep = () => {
        setIsSleeping(true); // Set sleeping state to true
        setCurrentFace(6); // Change the face to the sleepy face
    };

    const wakeUpPet = () => {
        setIsSleeping(false); // Set sleeping state to false
        setCurrentFace(4); // Change the face back to the default face according to stats
    };

    const feedPet = () => {
        if (!isSleeping && hunger > MIN_LEVEL) {
            setHunger((prevHunger) => Math.max(MIN_LEVEL, prevHunger - HUNGER_INCREMENT));
        }
    };

    const playWithPet = () => {
        if (energy >= PLAY_ENERGY_CONSUMPTION) {
            setEnergy((energy) => Math.max(MIN_LEVEL, energy - PLAY_ENERGY_CONSUMPTION));
        }
    };

    const giveWater = () => {
        if (!isSleeping && thirst > MIN_LEVEL) {
            setThirst((prevThirst) => Math.max(MIN_LEVEL, prevThirst - THIRST_INCREMENT));
        }
    };

    const [boxPosition, setBoxPosition] = useState({ x: 0, y: 0 });

    const handleFeed = () => {

        // Calculate the coordinates of the pet image
        const petImageX = 50; // Adjust these values based on the position and size of your pet image
        const petImageY = 10;
        const petImageWidth = 100;
        const petImageHeight = 100;

        // Calculate the coordinates of the box
        const boxX = boxPosition.x;
        const boxY = boxPosition.y;
        const boxWidth = 50; // Width of the box
        const boxHeight = 50; // Height of the box

        // Check if the box overlaps with the pet image
        if (
            boxX + boxWidth >= petImageX &&
            boxX <= petImageX + petImageWidth &&
            boxY + boxHeight >= petImageY &&
            boxY <= petImageY + petImageHeight
        ) {
                // If the box overlaps with the pet image and the pet is awake, trigger feed action
            feedPet();
        }
    };

    const panFood = useRef(new Animated.ValueXY()).current; // Red box
    const panWater = useRef(new Animated.ValueXY()).current; // Blue box
    const panPlay = useRef(new Animated.ValueXY()).current; // Blue box

    const petFood = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onPanResponderMove: Animated.event([null, { dx: panFood.x, dy: panFood.y }], { useNativeDriver: false }),
            onPanResponderRelease: (evt, gestureState) => {
                const { moveX, moveY } = gestureState;
                if (moveX > 100 && moveX < 300 && moveY > 200 && moveY < 400) {
                    // If box is dropped within the pet area, trigger feed action
                    handleFeed();
                }
                // Reset box position
                Animated.spring(panFood, {
                    toValue: { x: 0, y: 0 },
                    useNativeDriver: false,
                }).start();
                setBoxPosition({ x: 0, y: 0 });
            },
        }),
    ).current;

    const petWater = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onPanResponderMove: Animated.event([null, { dx: panWater.x, dy: panWater.y }], { useNativeDriver: false }),
            onPanResponderRelease: (evt, gestureState) => {
                const { moveX, moveY } = gestureState;
                if (moveX > 100 && moveX < 300 && moveY > 200 && moveY < 400) {
                    // If box is dropped within the pet area, trigger feed action
                    giveWater();
                }
                // Reset box position
                Animated.spring(panWater, {
                    toValue: { x: 0, y: 0 },
                    useNativeDriver: false,
                }).start();
                setBoxPosition({ x: 0, y: 0 });
            },
        }),
    ).current;

    const petPlay = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onPanResponderMove: Animated.event([null, { dx: panPlay.x, dy: panPlay.y }], { useNativeDriver: false }),
            onPanResponderRelease: (evt, gestureState) => {
                const { moveX, moveY } = gestureState;
                if (moveX > 100 && moveX < 300 && moveY > 200 && moveY < 400) {
                    // If box is dropped within the pet area, trigger feed action
                    playWithPet();
                }
                // Reset box position
                Animated.spring(panPlay, {
                    toValue: { x: 0, y: 0 },
                    useNativeDriver: false,
                }).start();
                setBoxPosition({ x: 0, y: 0 });
            },
        }),
    ).current;

    return (
        <View style={styles.container}>
            <TouchableOpacity onPress={isSleeping ? wakeUpPet : makePetSleep}>
            <Face whichFace={currentFace} />
            </TouchableOpacity>
            <Text>Hunger Level: {hunger}</Text>
            <Text>Thirst Level: {thirst}</Text>
            <Text>Energy Level: {energy}</Text>
            <View style={styles.boxContainer}>
                {!isSleeping && ( // Render the boxes only if the pet is not sleeping
                    <>
                        <ImageBackground style={styles.food}>
                            <Animated.View 
                                style={[
                                styles.food,
                                {transform: [{ translateX: panFood.x }, { translateY: panFood.y }],}, ]}
                                {...petFood.panHandlers} // Changed to use petFood panResponder
                           />
                        </ImageBackground>
                <Animated.View
                            style={[ styles.water,
                                {transform: [{ translateX: panWater.x }, { translateY: panWater.y }],}, ]}
                            {...petWater.panHandlers} // Changed to use petWater panResponder
                        />
                        <Animated.View
                    style={[
                                styles.play,
                                {transform: [{ translateX: panPlay.x }, { translateY: panPlay.y }],},]}
                            {...petPlay.panHandlers} // Changed to use petWater panResponder
                />
                    </>
                )}
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
    boxContainer: {
        flexDirection: 'row',
    },
    food: {
        width: 50,
        height: 50,
        margin: 15,
        resizeMode: 'cover',
        //backgroundImage: require('../assets/Play.png'),
    },
    water: {
        width: 50,
        height: 50,
        margin: 15,
    },
    play: {
        width: 50,
        height: 50,
        margin: 15,
        //backgroundImage: require('../assets/Food.png'),
    },
});
