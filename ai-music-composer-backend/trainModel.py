import glob
import pickle
import numpy
from music21 import converter, instrument, note, chord
from tensorflow.keras.models import Sequential # type: ignore
from tensorflow.keras.layers import Dense, Dropout, LSTM, Activation # type: ignore
from tensorflow.keras.layers import BatchNormalization as BatchNorm # type: ignore
from tensorflow.keras.utils import to_categorical # type: ignore
from tensorflow.keras.callbacks import ModelCheckpoint # type: ignore


def get_notes(dataPath):
    notes = []

    for file in glob.glob(dataPath):
        print(file)
        midi = converter.parse(file)

        print("Parsing %s" % file)

        parsing_notes = None

        try:
            s2 = instrument.partitionByInstrument(midi)
            parsing_notes = s2.parts[0].recurse()
        except:
            parsing_notes = midi.flat.notes

        for unit in parsing_notes:
            if isinstance(unit, note.Note):
                notes.append(str(unit.pitch))
            elif isinstance(unit, chord.Chord):
                notes.append(".".join(str(n) for n in unit.normalOrder))

    with open("./models/notes", "wb") as filepath:
        pickle.dump(notes, filepath)

    return notes


def prepare_sequences(notes, n_vocab):

    sequence_length = 100
    name_of_pitch = sorted(set(item for item in notes))
    note_to_int = dict((note, number) for number, note in enumerate(name_of_pitch))

    inputs_model = []
    output_model = []

    for i in range(0, len(notes) - sequence_length, 1):
        sequence_in = notes[i : i + sequence_length]
        sequence_out = notes[i + sequence_length]
        inputs_model.append([note_to_int[char] for char in sequence_in])
        output_model.append(note_to_int[sequence_out])

    n_patterns = len(inputs_model)

    inputs_model = numpy.reshape(inputs_model, (n_patterns, sequence_length, 1))

    inputs_model = inputs_model / float(n_vocab)

    output_model = to_categorical(output_model)

    return (inputs_model, output_model)


def create_network(inputs_model, n_vocab):
    model = Sequential()
    model.add(
        LSTM(
            512,
            input_shape=(inputs_model.shape[1], inputs_model.shape[2]),
            recurrent_dropout=0.3,
            return_sequences=True,
        )
    )
    model.add(
        LSTM(
            512,
            return_sequences=True,
            recurrent_dropout=0.3,
        )
    )
    model.add(LSTM(512))
    model.add(BatchNorm())
    model.add(Dropout(0.3))
    model.add(Dense(256))
    model.add(Activation("relu"))
    model.add(BatchNorm())
    model.add(Dropout(0.3))
    model.add(Dense(n_vocab))
    model.add(Activation("softmax"))
    model.compile(loss="categorical_crossentropy", optimizer="rmsprop")

    return model


def train(model, inputs_model, output_model):
    filepath = "models/weights-improvement-{epoch:02d}-{loss:.4f}-bigger.keras"
    checkpoint = ModelCheckpoint(
        filepath, monitor="loss", verbose=0, save_best_only=True, mode="min"
    )
    callbacks_list = [checkpoint]

    model.fit(
        inputs_model, output_model, epochs=200, batch_size=128, callbacks=callbacks_list
    )


def train_network(dataPath):
    notes = get_notes(dataPath)
    n_vocab = len(set(notes))
    inputs_model, output_model = prepare_sequences(notes, n_vocab)
    model = create_network(inputs_model, n_vocab)
    train(model, inputs_model, output_model)


train_network("datasets/*.mid")
