import { Image, View } from 'react-native';

const happyFace = require('../assets/Happy.png');
const okayFace = require('../assets/Okay.png');
const mehFace = require('../assets/Meh.png');
const angryFace = require('../assets/Angry.png');
const sadFace = require('../assets/Sad.png');
const deadFace = require('../assets/Dead.png');
const sleepyFace = require('../assets/Sleepy.png');

const faces = [
    happyFace,
    okayFace,
    mehFace,
    angryFace,
    sadFace,
    deadFace,
    sleepyFace,
]

export default function Face(props) {
    return (
        <View>
            <Image
                style={{ height: 200, width: 200, resizeMode: 'center' }}
                source={faces[props.whichFace]}
            />

        </View>


    )

}