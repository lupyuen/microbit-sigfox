# microbit-sigfox
Send microbit sensor data to Sigfox with Sigfox Wisol Breakout Board. Coded in MakeCode and JavaScript.

Tested with the Sigfox Wisol Breakout Board by Upton Lai:

https://www.tindie.com/products/Upton/breakout-board-of-wisol-module-for-sigfox-network/

## Log

```
net >> Wait for net
net >> Got net
>> ATS410=0[13]               
<< OK                         
>> AT$I=10[13]                
<< 003FA49D                   
<< wisol.getID 003FA49D
>> AT$I=11[13]                
<< B99F7CE054591652           
<< wisol.getPAC B99F7CE054591652
net >> Release net
tmp << Recv data 30
   tmp: 30
lig << Recv data 255
   lig: 255
acl << Recv data 988
   acl: 988
tmp << Recv data 30
   tmp: 30
agg >> Send 0000030025509880
net >> Wait for net
net >> Got net
>> AT$GI?[13]                 
<< 1,3                        
>> AT[13]                     
<< OK                         
>> AT$SF=0000030025509880[13] 
<< OK                         
net >> Release net
lig << Recv data 0
   lig: 0
acl << Recv data 988
   acl: 988
net >> Process pending response
tmp << Recv data 30
   tmp: 30
lig << Recv data 0
   lig: 0
acl << Recv data 988
   acl: 988
tmp << Recv data 30
   tmp: 30
agg >> Send 0001030000009880
net >> Wait for net
net >> Got net
>> AT$GI?[13]                 
<< 1,0                        
>> AT$RC[13]                  
K<< O                         
>> AT$SF=0001030000009880[13] 
<< OK                         
net >> Release net
lig << Recv data 0
   lig: 0
acl << Recv data 979
   acl: 979
net >> Process pending response
tmp << Recv data 30
   tmp: 30
lig << Recv data 0
   lig: 0
acl << Recv data 988
   acl: 988
tmp << Recv data 30
   tmp: 30
agg >> Send 0002030000009880
net >> Wait for net
net >> Got net
>> AT$GI?[13]                 
<< 1,3                        
>> AT[13]                     
<< OK                         
>> AT$SF=0002030000009880[13] 
<< OK                         
net >> Release net
lig << Recv data 0
   lig: 0
acl << Recv data 988
   acl: 988
net >> Process pending response
tmp << Recv data 30
   tmp: 30
lig << Recv data 0
   lig: 0
acl << Recv data 998
   acl: 998
tmp << Recv data 30
   tmp: 30
agg >> Send 0003030000009980
net >> Wait for net
net >> Got net
>> AT$GI?[13]                 
<< 1,0                        
>> AT$RC[13]                  
<< OK                         
>> AT$SF=0003030000009980[13] 
<< OK                         
net >> Release net
lig << Recv data 0
   lig: 0
acl << Recv data 988
   acl: 988
net >> Process pending response
tmp << Recv data 30
   tmp: 30
lig << Recv data 0
   lig: 0

```

