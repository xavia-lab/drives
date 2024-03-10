# Drives


#### Table of Contents
1. [Description](#description)
2. [Build](#build)

## 1. Description

I have collected a lot of storage drives (HDDs, SSDs) in different form factors over a long period of time. I have been tracking then in a simple mark down file for a long time but it lacks a lot of things that would like to keep track of. For example `date of purchase`, `capacity`, `model`, `manufacturer`, `retailer` and a log of events for each drive. This is a simple database App that will allow me to maintaine an inventory of all things related to my storage drives and maybe provide some cool statistics, like a graph of drives by age group, oldest drive, so on an so forth.

## 2. Build

These are commands used for building the project with `node`.

### a. API Server

The code for API server is under `server` directory.

#### Install

```bash
npm install
```

#### Run Tests

```bash
npm run test
```

#### Format Code

```bash
npx prettier . --write
```

#### Run Server for Development

```bash
npm run dev
```
