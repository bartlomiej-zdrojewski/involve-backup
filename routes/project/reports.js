const express = require('express'),
    path = require('path'),
    db = require(path.join(__dirname,'../..','db')),
    fs = require('fs'),
    Mailer = require(path.join(__dirname,'../..','mailer'));

const router = express.Router();

function GetAndTestExtensions(filename, allowedExtensions) {
    const extension = filename.substr(filename.length - 4).toLowerCase();

    let containedInAllowed = false;
    if (allowedExtensions != undefined) {
        for (let i = 0; i < allowedExtensions.length; i++) if (allowedExtensions[i] == extension) containedInAllowed = true;
    }

    if (containedInAllowed) return {filename: filename, extension: extension}
}

router.post('/document', function (req, res) {
    let fstream;    //TODO: check externally if user is leader for more security
    req.pipe(req.busboy);
    req.busboy.on('file', function (fieldname, file, filename) {
        console.log('Uploading a document');
        const fileDataObj = GetAndTestExtensions(filename, ['.pdf', '.txt']);
        if (fileDataObj.filename == null) return res.set(401).send('err');

        const newFilePath = path.join(__dirname,'../..','documents/reports', req.query.hash + db.GenId(4) + fileDataObj.extension);
        fstream = fs.createWriteStream(newFilePath);

        file.pipe(fstream);

        fstream.on('close', function () {
            console.log('Upload for ' + req.query.hash + '  ');
            res.send('report sent');
            // db.GetProject(req.query.hash,function (err, project) {
            //     Mailer.SendReportToMentor(project, 'contact@involve.space', fileDataObj.filename + fileDataObj.extension, file);
            // });
        })


    })
});

router.post('/link', function (req, res) {
    db.GetProject(req.query.hash, function (err, project) {
        Mailer.SendReportToMentor(project, 'bc.biran@gmail.com', req.body.link);
        res.send('report sent');
    });
});


router.get('/', function (req, res) {
    if (req.query.hash)
        db.GetReports(req.query.hash, function (err, result) {
            if (err) {
                console.log(err);
                return res.send('cos poszlo nie tak');
            }

            result.notifications = req.notifications;

            db.GetProject(req.query.hash, (err, project) => {
                db.GetUserInProjectStatus(req.user, project, function (err, resultFlags) {
                    if(err)
                    {
                        console.log("invalid user in /reports");
                        res.send('invalid user');
                    }
                    result.mentor = resultFlags.mentor;
                    result.leader = resultFlags.leader;
                    result.closed = project.closure.closed;
                    res.json(result);
                });
            })


        });
    else {
        console.log('Invalid request made to /reports');
        res.send('hash query parameter missing from url')
    }


});


router.post('/send', function (req, res) {
    db.MarkReportsAsSent(req.query.hash, function (err, report) {
        if (err) {
            console.log(err);
            return res.send(err.message);
        }
        res.send('ok');
    })
});

router.post('/update', function (req, res) {
    db.UpdateReports(req.query.hash, req.body.reports, function (err) {
        if (err) {
            console.log(err);
            return res.send(err.message)
        }
        res.send('ok');
    })
});



module.exports = router;