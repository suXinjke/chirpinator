import React from 'react'
import { hot } from 'react-hot-loader'

import './App.scss'

function formatNumberTime(timeInSeconds = 0) {
    const hours     = Math.floor( timeInSeconds / 3600 ).toString().padStart( 2, "0" )
    const minutes   = Math.floor( ( timeInSeconds / 60 ) % 60 ).toString().padStart( 2, "0" )
    const seconds   = Math.floor( timeInSeconds % 60 ).toString().padStart( 2, "0" )

    return `${hours}:${minutes}:${seconds}`
}

const Task = ( { title, seconds, active, onTitleChange, onStart, onPause, onRemove } ) => (
    <div className={`task ${active ? 'task_active' : ''}`}>
        <input className="task__input" value={title} onChange={ e => onTitleChange( e.target.value ) }/>
        <div className="task__panel">
            <span className="task__time">{ formatNumberTime( seconds ) }</span>
            <button onClick={ () => {
                active ? onPause() : onStart()
            } }
            >{ active ? 'Pause' : 'Run' }</button>

            <button onClick={ onRemove }
            >Remove</button>
        </div>
    </div>
)

const defaultState = {
    idCounter: 1,
    activeTaskId: null,
    tasks: []
}

class App extends React.Component {

    constructor( props ) {
        super( props )

        const preservedState = localStorage.getItem( 'chirpinatorState' )
        this.state = preservedState ? JSON.parse( preservedState ) : defaultState
    }

    componentDidMount() {
        setInterval( () => {
            this.setState( ( { activeTaskId, tasks } ) => {
                if ( activeTaskId === null ) {
                    return
                }

                return {
                    tasks: tasks.map( ( task ) => task.id !== activeTaskId ? task : { ...task, seconds: task.seconds + 1 } )
                }
            }, () => {
                localStorage.setItem( 'chirpinatorState', JSON.stringify( this.state ) )
            } )
        }, 1000 )
    }

    addNewTask = () => {
        const { idCounter, tasks } = this.state
        this.setState( {
            tasks: tasks.concat( {
                id: idCounter,
                title: '',
                seconds: 0
            } ),
            idCounter: idCounter + 1
        } )
    }

    render() {
        const { tasks, activeTaskId } = this.state

        const totalSeconds = tasks.reduce( ( prev, task ) => prev + task.seconds, 0 )

        return (
            <div className="tasks">
                <div className="tasks__titles">
                    <h1>CHIRPINATOR</h1>
                    <h3>Overall time</h3>
                    <h2>{ formatNumberTime( totalSeconds ) }</h2>
                </div>
                <div className="tasks__list">
                { tasks.map( ( { id, title, seconds }, index ) => (
                    <Task
                        key={id}
                        title={title}
                        seconds={seconds}
                        active={activeTaskId === id}
                        onTitleChange={ (title) => {
                            this.setState( {
                                tasks: tasks.map( ( task, taskIndex ) => index !== taskIndex ? task : { ...task, title } )
                            } )
                        } }
                        onStart={ () => {
                            this.setState( { activeTaskId: id } )
                        } }
                        onPause={ () => {
                            this.setState( { activeTaskId: null } )
                        } }
                        onRemove={ () => {
                            this.setState( {
                                activeTaskId: activeTaskId === id ? null : activeTaskId,
                                tasks: tasks.filter( ( _, taskIndex ) => index !== taskIndex )
                            } )
                        } }
                    />
                ) ) }
                </div>
            <button className="tasks__add-new-task-button" onClick={ this.addNewTask }>Add new</button>
            </div>
        )
    }
}

export default hot( module )( App )