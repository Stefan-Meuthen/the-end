import "./App.css";
import "./Homepage.css";

function Homepage(data) {

    return(
        <div className="content">
            <br />
            <hr />
            <br />
            <br />
            <h1>
                BIOGRAFIA
            </h1>
            <br />
            <br />
            <hr />
            <div className="container">
                <img src={data.image} alt="EH VOLEVI" />
                <p><br />
                    Ho sprecato 12 settimane per arrivare a questo punto e non nego che le ultime 2 ho 
                    copiato e incollato tutto. Ho sempre odiato programmare, ma grazie a questo corso ho 
                    capito che l'odio non è mai abbastanza. E si ho speso 500€ per il corso e 12€ per un dominio e sto pagando per tenere questo sito attivo, e nonnostante ciò come potrai notare il sito fa cagare al cazzo e non funziona a tratti. Le parti ben fatte? quelle le ho capiate e incollate. 
                </p>
            </div>
        </div>
    )
}

export default Homepage;