# microbit-sigfox
Send microbit sensor data to Sigfox with Sigfox Wisol Breakout Board. Coded in MakeCode and JavaScript.

## Log

```
 net >> Wait for net
net >> Got net
>> ATS410=0
                  
 << OK                         
>> AT$I=10
                   
 << 003FA49D                   
 - wisol.getID: 003FA49D
>> AT$I=11
                   
<< B99F7CE054591652           
 - wisol.getPAC: B99F7CE054591652
net >> Release net
tmp << Recv data 30
lig << Recv data 255
agg >> Send 0000003005520000
net >> Wait for net
net >> Got net
>> AT$GI?
                    
 << 1,3                        
>> AT
                        
 << OK                         
>> AT$SF=0000003005520000
    
 << OK                         
net >> Release net
tmp << Recv data 30
net >> Pending response
lig << Recv data 255
tmp << Recv data 30
lig << Recv data 255
agg >> Send 0000003005520000
net >> Wait for net
net >> Got net
>> AT$GI?
                    
<< 1,0                        
>> AT$RC
                     
 << OK                         
>> AT$SF=0000003005520000
    
 << OK                         
net >> Release net
tmp << Recv data 30
net >> Pending response

```

## TODO

- [ ] Add a reference for your blocks here
- [ ] Add "icon.png" image (300x200) in the root folder
- [ ] Add "- beta" to the GitHub project description if you are still iterating it.
- [ ] Turn on your automated build on https://travis-ci.org
- [ ] Use "pxt bump" to create a tagged release on GitHub
- [ ] Get your package reviewed and approved https://makecode.microbit.org/packages/approval

Read more at https://makecode.microbit.org/packages/build-your-own

## License



## Supported targets

* for PXT/microbit
(The metadata above is needed for package search.)

