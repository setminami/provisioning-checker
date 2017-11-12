#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# Apple Provisioning Check
# (c) 2016 set_minami@me.com
# this made for python3 Python 3.5.1 :: Anaconda 4.0.0 (x86_64)
# https://developer.apple.com/library/content/documentation/IDEs/Conceptual/AppDistributionGuide/MaintainingProfiles/MaintainingProfiles.html
# https://developer.apple.com/library/content/documentation//Security/Conceptual/CodeSigningGuide/Procedures/Procedures.html
import os, sys, argparse, typing, difflib
import datetime as dt
import subprocess as sp


DEVNULL = ' > /dev/null 2> /dev/null'
BEGINSIGN = '-----BEGIN CERTIFICATE-----'
ENDSIGN = '-----END CERTIFICATE-----'
DATAOPEN = '<data>'
DATACLOSE = '</data>'

class ProvisioningChecker:
    """ openssl handling"""
    DEBUG = False

    def __init__(self):
        self.ARGS = ProvisioningChecker.ArgParser()

    def out(self, msg, end='\n'):
        sys.stdout.write(msg + end)

    def preCheck(self):
        precmd = 'type openssl; openssl version'
        if sp.check_call(precmd, shell=True) != 0:
            self.out('openssl NOT FOUND!')
            sys.exit(1)
        pass

    def check(self):
        self.preCheck()
        tmp = self.ARGS.outpath + '/'
        now = dt.datetime.today()
        dateTmp = tmp + now.strftime('%Y%m%dT%H%M%S')
        exts = ['.out', '.rawkey', '.pem', '-x509.txt']
        p12out = [dateTmp + '/pkcs12' + ext for ext in exts]
        p12 = False
        provout = [dateTmp + '/provision' + ext for ext in exts]
        prov = False

        if not os.path.isdir(tmp):
            os.mkdir(tmp)

        os.mkdir(dateTmp)
        if self.ARGS.cert is not '' :
            self.analyzeP12(self.ARGS.p12pswd, p12out)
            p12 = True
            pass
        if self.ARGS.provision is not '' :
            self.analyzeProvisioning(provout)
            prov = True
            pass

        files = (self.ARGS.cert, self.ARGS.provision)
        outFile = dateTmp + '/diffResult.txt'
        if p12 and prov:
            diff, differences = self.compareX509((p12out[3], provout[3]))
            if diff :
                self.out('>> NG!!!! <%s> doesn\'t match with <%s> !'%files)
                info = '- : %s\n+ : %s'%files
                self.out(info)
                pass
            else :
                self.out('>> OK %s  matches with %s '%files)
                info = 'Matched Certification as X.509\n%s\n%s'%files
                pass

            self.out('see results %s in X.509 details.'%outFile)
            f = open(outFile, 'w')
            f.write(info + '\n==========\n' + differences)
            f.close
            sys.exit(0)
        pass

    def analyzeP12(self, passwd, workFiles):
        cmd = 'openssl pkcs12 -password pass:%s -in %s -out %s -nodes'%(passwd, self.ARGS.cert, workFiles[0])
        result = sp.check_call(cmd + DEVNULL, shell=True)
        if result != 0:
            self.out('pkcs12 failure! Please Check %s formats.'%self.ARGS.cert)
        else:
            self.out('p12 Dump Success\n> %s'%workFiles[0])
            self.getDataPart(workFiles, (BEGINSIGN, ENDSIGN))
            pass
        self.x509Out(workFiles)
        pass

    def analyzeProvisioning(self, workFiles):
        self.pullDeveloperCert(workFiles)
        self.x509Out(workFiles)
        pass

    def pullDeveloperCert(self, fileNames):
        cmd = 'security cms -D -i %s | plutil -extract DeveloperCertificates xml1 -o %s -'%(self.ARGS.provision, fileNames[0])
        # macOS 10.12 security: SecPolicySetValue: One or more parameters passed to a function were not valid.
        result = sp.check_call(cmd + DEVNULL, shell=True)
        if result != 0:
            self.out('provisioning profile failure! Please Check %s formats.'%self.ARGS.provision)
        else:
            self.out('DeveloperCertificates Dump Success\n> %s'%fileNames[0])
            self.getDataPart(fileNames, (DATAOPEN, DATACLOSE))
            pass
        pass

    def x509Out(self, workFiles):
        cmd = 'openssl x509 -in %s -noout -text > %s'%(workFiles[2], workFiles[3])
        result = sp.check_call(cmd, shell=True)
        if result != 0:
            self.out('x509 Dump Failure! Please Check %s formats.'%workFiles[2])
        else:
            self.out('x509 (rfc5280) Dump Success\n> %s'%workFiles[3])
            pass
        pass

    def getDataPart(self, fileNames, signs):
        val = open(fileNames[1], 'w')
        data = [BEGINSIGN, '\n', ENDSIGN]
        pull = False
        OPEN, CLOSE = signs
        with open(fileNames[0], 'r') as f:
            for line in f:
                # 雑
                if pull and not (CLOSE in line):
                    l = line.replace('\t', '')
                    val.write(l)
                    data[-1:0] = l
                    pass

                if OPEN in line:
                    pull = True
                elif CLOSE in line:
                    break
        pem = open(fileNames[2], 'w')
        # ProvisioningChecker.DebugPrint(data)
        pem.write("".join(data))
        pem.close()
        val.close()
        pass

    # True: Not Match/ False: Match
    def compareX509(self, files):
        diff = difflib.Differ().compare(open(files[0]).readlines(),
                                        open(files[1]).readlines())
        isDiff = False
        ret = ''
        for x in diff:
            ret += x
            if x.startswith('+') or x.startswith('-') or x.startswith('?'):
                self.out(x, end='')
                isDiff = True
                pass
        return (isDiff, ret)

    @staticmethod
    def ArgParser():
        argParser = argparse.ArgumentParser(prog=__file__,
            usage='')
        # Version desctiprtion
        argParser.add_argument('--version',
            action='version',
            version='%(prog)s 1.0')
        # argParser.add_argument('-v', '--verbose', nargs='?', dest='isVerbose',
        #    action='store_true')
        argParser.add_argument('-c', '--cert',
            nargs='?', type=str, default='',
            help='.p12 file name')
        argParser.add_argument('-pwd', '--p12pswd',
            nargs='?', type=str, default='',
            help='.p12 file password')
        argParser.add_argument('-p', '--provision',
            nargs='?', type=str, default='',
            help='[iOS: .mobileprovision] file name')
        argParser.add_argument('-o', '--outpath',
            nargs='?', type=str, default='./tmp',
            help='set temporary output path')
        ProvisioningChecker.DebugPrint(sys.argv)
        return argParser.parse_args()

    @staticmethod
    def DebugPrint(str):
        if ProvisioningChecker.DEBUG:
            print(str)
        else:
            pass

if __name__ == '__main__':
    ins = ProvisioningChecker()
    ins.check()
