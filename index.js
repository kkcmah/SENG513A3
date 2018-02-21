let express = require('express');
let app = express();
let http = require('http').Server(app);
let io = require('socket.io')(http);

let port = process.env.PORT || 3000;
let messages = [];
let users = [];

app.use(express.static('public'));

io.on('connection', function(socket){
    let user = {
        name: '',
        color: ''
    };
    socket.on('cookies', function(msg){
        let cname = decodeURIComponent(msg[0]);
        if(cname !== '') {
            function isTaken(obj) {
                return obj.name === cname;
            }

            if(users.find(isTaken) === undefined) {
                user.name = cname;
                user.color = decodeURIComponent(msg[1]);
                users.push(user);
            }
            else {
                user = assignName();
            }
        }
        else {
            user = assignName();
        }
        for(let m of messages) {
            socket.emit('chat message', m);
        }
        socket.emit('name change', user);
        io.emit('users update', users);
    });
    socket.on('chat message', function(msg){
        let firstWord = msg.toLowerCase().split(" ")[0];
        let d = new Date();
        let message = {
            time: ('00' + d.getHours()).slice(-2) + ":" + ('00' + d.getMinutes()).slice(-2),
            user: user.name,
            color: user.color,
            msg: msg
        };

        io.emit('chat message', message);
        messages.push(message);
        if(firstWord === '/nick') {
            let newName = msg.substring(6);

            function isTaken(obj) {
                return obj.name === newName;
            }
            if(newName.trim() !== "" && users.find(isTaken) === undefined) {
                user.name = newName;
                socket.emit('name change', user);
                io.emit('users update', users);
            }
        }
        else if(firstWord === '/nickcolor') {
            let newColor = msg.substring(11);
            if(/^[0-9A-F]{6}$/i.test(newColor)) {
                user.color = '#' + newColor;
                socket.emit('name change', user);
                io.emit('users update', users);
            }
        }
    });
    socket.on('disconnect', function() {
        function dcName(obj) {
            return obj.name === user.name;
        }
        users.splice(users.findIndex(dcName), 1);
        io.emit('users update', users);
    });
});

http.listen(port, function(){
    console.log('listening on *:' + port);
});

function assignName() {
    let allAnimals = 'alligator, anteater, armadillo, auroch, axolotl, badger, bat, beaver, buffalo, camel, chameleon, cheetah, chipmunk, chinchilla, chupacabra, cormorant, coyote, crow, dingo, dinosaur, dog, dolphin, duck, elephant, ferret, fox, frog, giraffe, gopher, grizzly, hedgehog, hippo, hyena, jackal, ibex, ifrit, iguana, kangaroo, koala, kraken, lemur, leopard, liger, lion, llama, manatee, mink, monkey, moose, narwhal, nyan cat, orangutan, otter, panda, penguin, platypus, python, pumpkin, quagga, rabbit, raccoon, rhino, sheep, shrew, skunk, slow loris, squirrel, tiger, turtle, walrus, wolf, wolverine, wombat';
    let animals = allAnimals.split(", ");
    let name = animals[Math.floor(Math.random() * animals.length)];

    function isTaken(obj) {
        return obj.name === name;
    }
    while(users.find(isTaken) !== undefined) {
        name = animals[Math.floor(Math.random() * animals.length)];
    }

    let user = {
        name: name,
        color: '#' + Math.floor(Math.random() * 999999)
    };
    users.push(user);
    return user;
}
